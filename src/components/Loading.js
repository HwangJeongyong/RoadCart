import React, { useEffect} from 'react'
import { css } from "@emotion/react";
import BeatLoader from "react-spinners/BeatLoader";
import '../CSS/Loading.css'
 
const override = css`
  display: block;
  margin: 0 auto;
  border-color: rgba(255,255,255,0.7);
  border-width: 10px;
`;
 
const Loading = (props) => {
  const check = props.loading == null ? false : props.loading
 
  return (
    check &&
    <div className='axios-loading' style={{display:props.loading===true?'block':'none'}}>
        <div className='axios-loading-indicator'>
            <BeatLoader color={"white"} loading={props.loading} css={override}  size={40} />
        </div>
    </div>
  )
 
}