import "./App.css";
import React, { createRef, useEffect, useState, forwardRef } from "react";
import { CustomOverlayMap, Map, MapMarker, Polyline } from "react-kakao-maps-sdk";
import axios from "axios";
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css';
import './Calendar.css';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Modal from './components/Modal'
import Review from './components/Review';
import Cart from './components/Cart'
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { ko } from "date-fns/esm/locale";
import PinDropIcon from '@mui/icons-material/PinDrop';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import Loading from "./components/Loading"

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
  const [pathList, setPathList] = useState([]);
  const [dateStatus, setDateStatus] = useState();
  const search = createRef();
  const roadDisplayed = createRef();
  const searchDisplayed = createRef();
  const plannerDisplayed = createRef();
  const [lineOpacity, setLineOpacity] = useState(false);
  const [dateRange, setDateRange] = useState([new Date(), null]);
  const [startDate, endDate] = dateRange;
  const [columns, setColumns] = useState(initialColumn);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [state, setState] = useState({
    // 지도의 초기 위치
    center: { lat: 33.452613, lng: 126.570888 },
    // 지도 위치 변경시 panto를 이용할지에 대해서 정의
    isPanto: false,
  })
  const [backColor, setBackColor] = useState({road: {back:"white",text:"black"},search: {back:"#2196f3",text:"white"},planner: {back:"white",text:"black"}});

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
        .then((res)=>{
          list = res.data;
        })

        for (var i = 0; i < data.length; i++) {
          // @ts-ignore
          markers.push({
            poi_name: data[i].place_name,
            poi_category: data[i].category_name,
            lat: data[i].y,
            lng: data[i].x,
            poi_addr: data[i].address_name,
            poi_img: list[i].img,
            poi_info: list[i].review
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
      console.log(update);
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

  const ExampleCustomInput = forwardRef(({ value, onClick }, ref) => ( // 캘린더 커스텀
    <button className="example-custom-input" onClick={onClick} ref={ref}>
      {value}
    </button>
  ));

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

  useEffect(()=>{ // 마커클릭시 지도이동
    if(!info) return;
    setState({
      center: {lat: info.lat, lng: info.lng},
      isPanto: true
    })
    // const bounds = new kakao.maps.LatLngBounds();
    // bounds.extend(new kakao.maps.LatLng(info.lat, info.lng));
    // map.panTo(bounds,32,32,32,700);
    // map.setLevel(4, {animate: true})
  },[info]);

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
  const openReview = () => {
    setReviewOpen(true);
  };
  const closeReview = () => {
    setReviewOpen(false);
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
    axios.post('save/road/schedule/register',data).then((res)=>{console.log(res);});
  }


  return (
    <div className="content-container">
      <React.Fragment>
      <Modal open={modalOpen} close={closeModal} save={save} header="제목 : ">
      </Modal>
      <Review open={reviewOpen} close={closeReview} info={info} header="Review Link">
      </Review>
      <div>
        <div className="menu-container" style={{display: "flex", flexDirection:"column", width:"4vw", height: "100vh", borderRight: "solid 1px black"}}>
          <div onClick={()=>{getApi()}} style={{marginTop: "20px", textAlign: "center", paddingBottom: "20px"}}>
            <button>메인</button><div>홈</div></div>
          <div onClick={()=>{searchDisplay();setDateStatus();let color = backColor.search.back !== "white" ? {back:"white",text:"black"} : {back:"#2196f3",text:"white"};setBackColor({...backColor, search: color})}} 
          style={{textAlign: "center", backgroundColor: backColor.search.back, color: backColor.search.text, paddingBottom: "15px", paddingTop: "15px"}}>
            <PinDropIcon color=""/><div>검색</div></div>
          <div onClick={()=>{plannerDisplay();let color = backColor.planner.back !== "white" ? {back:"white",text:"black"} : {back:"#2196f3",text:"white"};setBackColor({...backColor, planner: color})}} 
          style={{textAlign: "center", backgroundColor: backColor.planner.back, color: backColor.planner.text, paddingBottom: "15px", paddingTop: "20px"}}>
            <EditCalendarIcon/><div>일정</div></div>
          <div onClick={(e)=>{roadDisplay();let color = backColor.road.back !== "white" ? {back:"white",text:"black"} : {back:"#2196f3",text:"white"};setBackColor({...backColor, road: color})}} 
          style={{textAlign: "center", backgroundColor: backColor.road.back, color: backColor.road.text, paddingBottom: "15px", paddingTop: "10px"}}>
            <Cart cartColor={backColor.road.text} num={columns.cart.items.length}/><div>길바구니</div></div>
        </div>
      </div>
        <div style={{position: "relative"}}>
          <DragDropContext onDragEnd={(result)=> onDragEnd(result, columns, setColumns)}>
            <SnackbarProvider autoHideDuration={2000} anchorOrigin={{ vertical: "top", horizontal: "center" }}/>
            <div>
            <div style={{position: "relative"}}>
              <div style={{position: "absolute", display: "flex", flexDirection: "row", zIndex:"2", background: "white"}}>
                {/* 검색탭 */}
                <div ref={searchDisplayed} className="search-container" style={{height: "100vh", width: "15vw", padding: "20px", borderRight: "solid 1px black"}}>
                    <div style={{height: "100px"}}>
                      <div className="searchDiv62">
                        <input className="searchInput62" placeholder="검색어 입력" ref={search} type="text" onKeyDown={(e)=>{e.code === "Enter" && setKeyword(search.current.value)}}/>
                        <button className="searchButton62" onClick={() => {setKeyword(search.current.value);}}>검색</button>
                      </div>
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
                <div ref={plannerDisplayed} className="planner-container" style={{display: "none", height: "100vh", width: "15vw", borderRight: "solid 1px black"}}> 
                  <div style={{position:"static",zIndex:"3", paddingLeft: "40px",paddingTop: "20px"}}>
                    <DatePicker
                      locale={ko}
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => {
                        setDateRange(update);
                        plannerDate(update);
                      }}
                      customInput={<ExampleCustomInput />}
                      dateFormat="MM월 dd일"
                    />
                      <button onClick={openModal}>저장하기</button>
                      
                  </div>
                  <div>
                    {Object.entries(columns).filter(item => item[0] !== "cart").map(([columnId, column], index) =>{
                      return (
                        <div className="liste2">
                        <Droppable key={columnId} droppableId={columnId}>
                          {(provided, snapshot) => (
                            <ol onClick={()=>{setMarkers(column.items);setDateStatus(columnId);}}
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                            >
                              <span onClick={()=>{setLineOpacity(true)}}>{parseInt(column.title.substring(4,6)).toString()}월 {parseInt(column.title.substring(6,8).toString())}일</span>
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
                            </ol>
                          )}
                        </Droppable>
                        </div>
                      )
                    })}
                    {/* {Object.entries(columns).filter(item => item[0] !== "cart").map(item=><div>{item[1].title}</div>)} */}
                  </div>
                </div>
                {/* 길바구니탭 */}
                <div ref={roadDisplayed} style={{display:"none", height: "100vh", width: "15vw", borderRight: "solid 1px black"}}>
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
                center={state.center}
                style={{ width: "95vw",height: "100vh" }} 
                isPanto={state.isPanto}
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
                  </MapMarker>
                ))}
                {info && 
                <CustomOverlayMap position={{lat: info.lat, lng: info.lng}} clickable={true} xAnchor={0.274}
                yAnchor={1.23}>
                  <div className="bubble">
                        <button className="bubble-close" type="button" onClick={()=>{setInfo()}}><img src=""/></button>
                        <strong style={{fontSize : "900"}}>{info.poi_name}</strong><br/>
                        {info.poi_category}<br/>
                        {info.poi_addr}<br/>
                        {info.poi_img && <div style={{position: "absolute", right: "15px", top: "80px"}}><img style={{width: "85px", height: "85px"}} src={info.poi_img}/></div>}
                        <div style={{position: "absolute", bottom: "25px"}}>
                        <Stack spacing={2} direction="row">
                        <Button variant="contained" onClick={()=>{addCart(info)}}>카트에 담기</Button>
                        {info.poi_info && <Button variant="contained" onClick={openReview}>리뷰보기</Button>}
                        </Stack>
                        </div>
                      </div>
                </CustomOverlayMap>}
              </Map>
            </div>
          </DragDropContext>
        </div>
        </React.Fragment>
    </div>
  );
}

export default App;
