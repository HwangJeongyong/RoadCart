import "./App.css";
import React, { createRef, useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import SearchList from "./components/SearchList";
import axios from "axios";
import { SnackbarProvider, enqueueSnackbar } from 'notistack';

function App() {
  const { kakao } = window;
  const [info, setInfo] = useState();
  const [markers, setMarkers] = useState([]);
  const [map, setMap] = useState();
  const [keyword, setKeyword] = useState("");
  const [imgList, setImgList] = useState([]);
  const [roadList, setRoadList] = useState([]);
  const search = createRef();
  const roadDisplayed = createRef();
  

  useEffect(() => {
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
        await axios.post("scraper/", formData, config).then((res)=>{list = res.data; setImgList(res.data)})
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

  const addCart = (marker)=>{
    var isExist = roadList.find(road => (road.apiId === marker.apiId));
    if (isExist === undefined){
      setRoadList([...roadList, marker]);
      enqueueSnackbar(`${marker.poi_name} 추가 완료`);
    } else {
      enqueueSnackbar("이미 추가된 항목입니다");
    }
  }

  const removeCart = (idx) => {
    enqueueSnackbar(`${roadList[idx].poi_name} 삭제 완료`);
    setRoadList(roadList.slice(0,idx).concat(roadList.slice(idx+1,roadList.length)));
  }
  
  const roadDisplay = ()=>{
    roadDisplayed.current.style.display = roadDisplayed.current.style.display === "none" ? "block" : "none";
  }
  return (
    <div className="content-container">
      <SnackbarProvider autoHideDuration={2000} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}/>
      <div style={{width: "15vw", position: "relative"}}>
        <div className="search-container" style={{position: "absolute"}}>
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
        <div className="planner-container" style={{position: "absolute"}}>
          
        </div>
      </div>
      <div style={{position:"relative", zIndex:"1"}}>
        <div style={{position:"absolute", zIndex:"2"}}>
          <button onClick={()=>{roadDisplay()}}>장바구니</button>
          <div ref={roadDisplayed} style={{display:"none", position:"absolute", background: "whitesmoke", height: "90vh", width: "15vw"}}>
            <ul>
              {roadList.map((item, idx) => <li>{item.poi_name}<button onClick={()=>{removeCart(idx)}}>삭제</button></li>)}
            </ul>
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
    </div>
  );
}

export default App;
