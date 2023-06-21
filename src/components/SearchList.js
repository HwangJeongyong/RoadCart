import React from 'react'
import "../App.css";

const SearchList = ({data}) => {
  return (
    <div className='search-item-container'>
      <div>{data.poi_name}</div>
      {/* <div>{img === "" ? <div style={{width:"100px", height:"100px"}}/> : <img style={{width:"100px", height:"100px"}} src={img}/>}</div> */}
    </div>
  )
}

export default SearchList