import "./App.css";
import React, { createRef, useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import SearchList from "./components/SearchList";
import axios from "axios";
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css';
import './Calendar.css';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
  const [imgList, setImgList] = useState([]);
  const search = createRef();
  const roadDisplayed = createRef();
  const searchDisplayed = createRef();
  const plannerDisplayed = createRef();
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [columns, setColumns] = useState(initialColumn);
  

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
            position: {
              lat: data[i].y,
              lng: data[i].x,
            },
            poi_addr: data[i].address_name,
            poi_img: list[i],
            apiId: data[i].id
          });
          // @ts-ignore
          bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
        }
        setMarkers(markers);
        console.log(markers);

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
        map.setBounds(bounds);
      }
    });
  }, [map, keyword]);

  const addCart = (marker)=>{ // 길바구니에 추가
    var isExist = columns.cart.items.find(road => (road.apiId === marker.apiId));
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
    searchDisplayed.current.style.display = "block";
    plannerDisplayed.current.style.display = "none";
  }

  const plannerDisplay = ()=>{ // 일정관리 열기
    searchDisplayed.current.style.display = "none";
    plannerDisplayed.current.style.display = "block";
  }

  const getApi = async() => { // DB호출
    await axios.get("http://172.30.1.39:8089/road").then((res)=>{console.log(res);})
  }

  const plannerDate = (update)=>{ // 캘린더
    if (update[1] !== null) {
      let map = {};
      map.cart = columns.cart;
      for (let d = update[0].getTime(); d <= update[1].getTime(); d+=1000*3600*24){
        let date = new Date(d + 1000*3600*9);
        map[date] = {
          title: date,
          items: []
        }
      }
      setColumns(map)
    }
  }

  const onDragEnd = (result, columns, setColumns) => {
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

  return (
    <div className="content-container">
      <DragDropContext onDragEnd={(result)=> onDragEnd(result, columns, setColumns)}>
        <SnackbarProvider autoHideDuration={2000} anchorOrigin={{ vertical: "top", horizontal: "center" }}/>
        <div>
          <div className="menu-container">
            <button onClick={()=>{getApi()}}>홈</button> 
            <button onClick={()=>{searchDisplay()}}>여행지 추가</button>
            <button onClick={()=>{plannerDisplay()}}>일정관리</button>
          </div>
        <div style={{width: "15vw", position: "relative"}}>
          <div ref={searchDisplayed} className="search-container" style={{position: "absolute"}}>
            <div>
              <button onClick={() => {setKeyword(search.current.value);}}>검색</button>
              <input ref={search} type="text"/>
              <button onClick={()=>{search.current.value = "";}}>X</button>
            </div>
            <div>
              <ul>
                {markers.map((item,idx)=>
                  <li onClick={() => setInfo(markers[idx])} className="search-list">
                    <SearchList key={`item-${item.poi_name}-${item.position.lat},${item.position.lng}`} data={item} img={imgList[idx]}/></li>
                )}
              </ul>
            </div>
          </div>
          <div ref={plannerDisplayed} className="planner-container" style={{position: "absolute", display: "none"}}>
            <div style={{zIndex:"3"}}>
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  setDateRange(update);
                  plannerDate(update);
                }}
                isClearable={true}
              />
            </div>
            <div>
              {Object.entries(columns).filter(item => item[0] !== "cart").map(([columnId, column], index) =>{
                return (
                  <Droppable key={columnId} droppableId={columnId}>
                    {(provided, snapshot) => (
                      <ul
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        <span>{column.title.toUTCString()}</span>
                        {column.items.map((item, index) => (
                          <Draggable key={item.apiId} draggableId={item.apiId} index={index}>
                            {(provided) => (
                              <li
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
                    )

                    }
                  </Droppable>
                )
              })}
              {/* {Object.entries(columns).filter(item => item[0] !== "cart").map(item=><div>{item[1].title.toUTCString()}</div>)} */}
            </div>
          </div>
        </div>
        </div>
        <div style={{position:"relative", zIndex:"1"}}>
          <div style={{position:"absolute", zIndex:"2"}}>
            <button onClick={()=>{roadDisplay()}}>장바구니</button>
            <div ref={roadDisplayed} style={{display:"none", position:"absolute", background: "whitesmoke", height: "90vh", width: "15vw"}}>
              <Droppable key="cart" droppableId="cart">
                {(provided) => (
                  <ul
                    className="cart"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {columns.cart.items.map(({apiId, poi_name},index) => (
                      <Draggable key={apiId} draggableId={apiId} index={index}>
                        {(provided) => (
                          <li
                          ref={provided.innerRef}
                          {...provided.dragHandleProps}
                          {...provided.draggableProps}
                          >
                            {poi_name}<button onClick={()=>{removeCart(index)}}>삭제</button>
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
          <Map // 로드뷰를 표시할 Container
            center={{ lat: 37.566826,lng: 126.9786567 }}
            style={{ width: "80vw",height: "90vh" }} 
            level={3}
            onCreate={setMap}
          >
          
            {markers.map((marker, idx) => (
              <MapMarker
                key={`marker-${marker.poi_name}-${marker.position.lat},${marker.position.lng}`}
                position={marker.position}
                onClick={() => setInfo(marker)}
              >
                {info && info.position.lat + info.position.lng === marker.position.lat + marker.position.lng && (
                  <div style={{width: "300px", height: "200px", color: "#000" }}>
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
  );
}

export default App;
