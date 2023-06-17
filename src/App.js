import "./App.css";
import React, { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import SearchList from "./components/SearchList";
import axios from "axios";

function App() {
  const { kakao } = window;
  const [info, setInfo] = useState();
  const [markers, setMarkers] = useState([]);
  const [map, setMap] = useState();
  const [text, setText] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchData, setSearchData] = useState([]);
  const [imgList, setImgList] = useState([]);
  

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
        await axios.post("scraper/", formData, config).then((res)=>{list = res.data; setSearchData(data); setImgList(res.data)})
        for (var i = 0; i < data.length; i++) {
          // @ts-ignore
          markers.push({
            poi_name: data[i].place_name,
            poi_category: data[i].category_name,
            position: {
              lat: data[i].y,
              lng: data[i].x,
            },
            content: data[i].place_name,
            poi_addr: data[i].address_name,
            poi_img: list[i],
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

  return (
    <div className="content-container">
      <div>
        <div className="search-container">
          <button
            onClick={() => {
              setKeyword(text);
              // setImgList([]);
            }}
          >
            검색
          </button>
          <input
            onChange={(e) => {
              setText(e.target.value);
            }}
            type="text"
          ></input>
        </div>
        <div>
          <ul>
            {searchData.map((item,idx)=>
              <li onClick={() => setInfo(markers[idx])} className="search-list"><SearchList key={item.id} data={item} img={imgList[idx]}/></li>
            )}
          </ul>
        </div>
      </div>
      <div>
        <Map // 로드뷰를 표시할 Container
          center={{
            lat: 37.566826,
            lng: 126.9786567,
          }}
          style={{
            width: "60vw",
            height: "80vh",
          }}
          level={3}
          onCreate={setMap}
        >
          {markers.map((marker) => (
            <MapMarker
              key={`marker-${marker.content}-${marker.position.lat},${marker.position.lng}`}
              position={marker.position}
              onClick={() => setInfo(marker)}
            >
              {info && info.content === marker.content && (
                <div style={{width: "300px", height: "200px", color: "#000" }}>
                  <img style={{width: "50px", height: "50px"}} src={marker.poi_img}/><button onClick={()=>{setInfo()}}>X</button><br/>
                  {marker.poi_name}<br/>
                  {marker.poi_category}<br/>
                  {marker.poi_addr}
                </div>
              )}
            </MapMarker>
          ))}
        </Map>
      </div>
      <div>{}</div>
    </div>
  );
}

export default App;
