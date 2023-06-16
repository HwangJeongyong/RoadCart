import React, {useEffect} from 'react'

const App2 = () => {
    const {kakao} = window;
    useEffect(()=>{
        var markers = [];
        var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
        mapOption = {
            center: new kakao.maps.LatLng(37.566826, 126.9786567), // 지도의 중심좌표
            level: 3 // 지도의 확대 레벨
        };  

        // 지도를 생성합니다    
        var map = new kakao.maps.Map(mapContainer, mapOption); 
        var ps = new kakao.maps.services.Places(); 
    },[])

    

  return (
    <div id='map' style={{width : "400px", height : "400px"}}></div>
  )
}

export default App2