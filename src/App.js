import "./App.css";
import React, { createRef, useEffect, useState } from "react";
import { Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import axios from "axios";
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css';
import './Calendar.css';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Modal from './components/Modal'
import Cart from './components/Cart'

function App() {
  const initialColumn = {
    cart : {
      title: "cart",
      items: []
    }
  };
  const { kakao } = window;
  const [info, setInfo] = useState();
  const [markers, setMarkers] = useState([]);
  const [map, setMap] = useState();
  const [keyword, setKeyword] = useState("");
  const [searchList, setSearchList] = useState([]);
  const [imgList, setImgList] = useState([]);
  const [pathList, setPathList] = useState([]);
  const [dateStatus, setDateStatus] = useState();
  const search = createRef();
  const roadDisplayed = createRef();
  const searchDisplayed = createRef();
  const plannerDisplayed = createRef();
  const [lineOpacity, setLineOpacity] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [columns, setColumns] = useState(initialColumn);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { // 지도검색
    if (!map) return;
    const ps = new kakao.maps.services.Places();

    ps.keywordSearch(keyword, async(data, status, _pagination) => {
      if (status === kakao.maps.services.Status.OK) {
        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        const bounds = new kakao.maps.LatLngBounds();
        let markers = [];
        let list = [];
        console.log(data);
        data.forEach(item => list.push(item.place_url))
        
        const formData = JSON.stringify({product_list: list})
        const config = {
            headers: {'Content-Type': 'application/json'}
        }

        await axios.post("scraper/", formData, config)
        .then((res)=>{list = res.data; setImgList(res.data)})

        for (var i = 0; i < data.length; i++) {
          // @ts-ignore
          markers.push({
            poi_name: data[i].place_name,
            poi_category: data[i].category_name,
            lat: data[i].y,
            lng: data[i].x,
            poi_addr: data[i].address_name,
            poi_img: list[i],
          });
          // @ts-ignore
          bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
        }
        setMarkers(markers);
        setSearchList(markers);
        // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
        map.setBounds(bounds,32,32,32,200);
      }
    });
  }, [map, keyword]);

  const addCart = (marker)=>{ // 길바구니에 추가
    let isExist = Object.entries(columns).find(road => (road[1].items.find(road0 => (road0.lat === marker.lat))));
    if (isExist === undefined){
      let newList = [...columns.cart.items, marker];
      let column = columns.cart;
      setColumns({
        ...columns,
        cart: {
          ...column,
          items: newList
        },
      });
      enqueueSnackbar(`${marker.poi_name} 추가 완료`);
    } else {
      enqueueSnackbar("이미 추가된 항목입니다");
    }
  }

  const removeCart = (idx) => { // 길바구니에서 제거
    enqueueSnackbar(`${columns.cart.items[idx].poi_name} 삭제 완료`);
    let column = columns.cart;
    let copiedList = [...column.items];
    copiedList.splice(idx,1);
    setColumns({
      ...columns,
      cart: {
        ...column,
        items: copiedList
      },
    });
  }
  
  const roadDisplay = ()=>{ // 길바구니 열기/닫기
    roadDisplayed.current.style.display = roadDisplayed.current.style.display === "none" ? "block" : "none";
  }

  const searchDisplay = ()=>{ // 검색 열기
    searchDisplayed.current.style.display = searchDisplayed.current.style.display === "none" ? "block" : "none";
  }

  const plannerDisplay = ()=>{ // 일정관리 열기
    plannerDisplayed.current.style.display = plannerDisplayed.current.style.display === "none" ? "block" : "none";
  }

  const getApi = async() => { // DB호출
    await axios.get("http://172.30.1.39:8089/road").then((res)=>{console.log(res);})
  }

  const plannerDate = (update)=>{ // 캘린더
    if (update[1] !== null) {
      let map = {};
      map.cart = columns.cart;
      console.log(map.cart);
      Object.entries(columns).filter(item => item[0] !== "cart").map(item=>item[1].items.map(e=>map.cart.items.push(e)));
      for (let d = update[0].getTime(); d <= update[1].getTime(); d+=1000*3600*24){
        let date = new Date(d + 1000*3600*9);
        let year = date.getFullYear().toString();
        let month = (date.getMonth()+1);
        month = month < 10 ? "0" + month.toString() : month.toString();
        let day = date.getDate();
        day = day < 10 ? "0" + day.toString() : day.toString();
        date = year + month + day;
        map[date] = {
          title: date,
          items: []
        }
      }
      setColumns(map)
    }
  }

  useEffect(()=>{ // 마커 리렌더링
    setInfo();
    if (!dateStatus) return;
    setMarkers(Object.entries(columns).find(item=>(item[0] == dateStatus))[1].items);
  },[columns])

  useEffect(()=>{ // 경로 리렌더링
    let list = [];
    markers.forEach(item => list.push({lat: item.lat, lng: item.lng}));
    setPathList(list);
  },[markers])

  // useEffect(()=>{ // 인포닫기
  //   if(dateStatus !== "cart")setInfo();
  // },[dateStatus])

  // useEffect(()=>{ // 마커클릭시 지도이동
  //   if(!info) return;
  //   const bounds = new kakao.maps.LatLngBounds();
  //   bounds.extend(new kakao.maps.LatLng(info.lat, info.lng));
  //   map.panTo(bounds,32,32,32,500);
  // },[info]);

  const onDragEnd = (result, columns, setColumns) => { // 드래그앤드롭
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      });
    } else {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    }
    
  };

  const openModal = () => {
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
  };

  const save = (title, content)=>{ // 저장하기
    let list = [];
    let id = "1111";
    Object.entries(columns).filter(item=>(item[0] !== "cart")).map(item=>item[1].items.map(e=>
      list.push({...e,poi_dt: item[1].title, user_id: id, poi_info: "1111"})
    ))
    let data = {
      t_schedule: {
        sche_title: title,
        sche_content: content,
        sche_start_dt: list[0].poi_dt,
        sche_end_dt: list[list.length - 1].poi_dt,
        user_id : id
      },
      t_poi : list
    }
    console.log(data);
    axios.post('save/road/schedule/save',data).then((res)=>{console.log(res);});
  }

  return (
    <div className="content-container">
      <div>
        <div className="menu-container" style={{display: "flex", flexDirection:"column", width:"4vw"}}>
          <button onClick={()=>{getApi()}}>메인</button> 
          <button onClick={()=>{searchDisplay();setDateStatus();}}>검색</button>
          <button onClick={()=>{plannerDisplay()}}>일정</button>
          <div onClick={()=>{roadDisplay()}}><Cart num={columns.cart.items.length}/></div>
        </div>
      </div>
        <div style={{position: "relative"}}>
          <DragDropContext onDragEnd={(result)=> onDragEnd(result, columns, setColumns)}>
            <SnackbarProvider autoHideDuration={2000} anchorOrigin={{ vertical: "top", horizontal: "center" }}/>
            <div>
            <div style={{position: "relative"}}>
              <div style={{position: "absolute", display: "flex", flexDirection: "row", zIndex:"2", background: "whitesmoke"}}>
                {/* 검색탭 */}
                <div ref={searchDisplayed} className="search-container" style={{height: "100vh", width: "15vw", border: "solid"}}>
                  <div>
                    <button onClick={() => {setKeyword(search.current.value);}}>검색</button>
                    <input ref={search} type="text" onKeyDown={(e)=>{e.code === "Enter" && setKeyword(search.current.value)}}/>
                    <button onClick={()=>{search.current.value = "";}}>X</button>
                  </div>
                  <div>
                    <ul>
                      {searchList.map((item,idx)=>
                        <li onClick={() => {setMarkers(searchList); setLineOpacity(false); setInfo(item);}} className="search-list">
                          {item.poi_name}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
                {/* 일정관리탭 */}
                <div ref={plannerDisplayed} className="planner-container" style={{display: "none", height: "100vh", width: "15vw", border: "solid"}}> 
                  <div style={{position:"static",zIndex:"3"}}>
                    <DatePicker
                      // open={endDate === null ? true : false}
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => {
                        setDateRange(update);
                        plannerDate(update);
                      }}
                      isClearable={true}
                    />
                    <React.Fragment>
                      <button onClick={openModal}>저장하기</button>
                      <Modal open={modalOpen} close={closeModal} save={save} header="제목 : ">
                      </Modal>
                    </React.Fragment>
                  </div>
                  <div>
                    {Object.entries(columns).filter(item => item[0] !== "cart").map(([columnId, column], index) =>{
                      return (
                        <Droppable key={columnId} droppableId={columnId}>
                          {(provided, snapshot) => (
                            <ul onClick={()=>{setMarkers(column.items);setDateStatus(columnId);}}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              <span onClick={()=>{setLineOpacity(true)}}>{column.title}</span>
                              {column.items.map((item, index) => (
                                <Draggable key={item.lat} draggableId={item.lat} index={index}>
                                  {(provided) => (
                                    <li onClick={()=>{setInfo(item); setLineOpacity(true)}}
                                      ref={provided.innerRef}
                                      {...provided.dragHandleProps}
                                      {...provided.draggableProps}
                                    >
                                      {item.poi_name}
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </ul>
                          )}
                        </Droppable>
                      )
                    })}
                    {/* {Object.entries(columns).filter(item => item[0] !== "cart").map(item=><div>{item[1].title}</div>)} */}
                  </div>
                </div>
                {/* 길바구니탭 */}
                <div ref={roadDisplayed} style={{display:"none", height: "100vh", width: "15vw", border: "solid"}}>
                  <Droppable key="cart" droppableId="cart">
                    {(provided) => (
                      <ul onClick={()=>{setMarkers(columns.cart.items);setDateStatus("cart");setLineOpacity(false);}}
                        className="cart"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        <span>길바구니</span>
                        {columns.cart.items.map((item, index) => (
                          <Draggable key={item.lat} draggableId={item.lat} index={index}>
                            {(provided) => (
                              <li
                              onClick={()=>{setInfo(item)}}
                              ref={provided.innerRef}
                              {...provided.dragHandleProps}
                              {...provided.draggableProps}
                              >
                                {item.poi_name}<button onClick={()=>{removeCart(index)}}>삭제</button>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>
            </div>
            <div style={{position:"absolute", zIndex:"1"}}>
              <Map // 로드뷰를 표시할 Container
                onClick={()=>{setInfo()}}
                center={{lng:126.919821259785, lat: 35.1498781550339}}
                style={{ width: "95vw",height: "100vh" }} 
                level={3}
                onCreate={setMap}
              >
                {lineOpacity === true && 
                <Polyline
                  path={[pathList]}
                  strokeWeight={5} // 선의 두께 입니다
                  strokeColor={"#FFAE00"} // 선의 색깔입니다
                  strokeOpacity={0.7} // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
                  strokeStyle={"solid"} // 선의 스타일입니다
                />}
                {markers.map((marker, idx) => (
                  <MapMarker
                    key={`marker-${marker.poi_name}-${marker.lat},${marker.lng}`}
                    position={{lat: marker.lat, lng: marker.lng}}
                    onClick={() => setInfo(marker)}
                  >
                    {info && info.lat + info.lng === marker.lat + marker.lng && (
                      <div style={{width: "300px", height: "200px", color: "#000"}}>
                        {imgList[idx] === "" ? <div style={{width: "50px", height: "50px"}}/> : <img style={{width: "50px", height: "50px"}} src={imgList[idx]}/>}
                        <button onClick={()=>{addCart(marker)}}>+</button>
                        <button onClick={()=>{setInfo()}}>X</button><br/>
                        {marker.poi_name}<br/>
                        {marker.poi_category}<br/>
                        {marker.poi_addr}
                      </div>
                    )}
                  </MapMarker>
                ))}
              </Map>
            </div>
          </DragDropContext>
        </div>
    </div>
  );
}

export default App;
