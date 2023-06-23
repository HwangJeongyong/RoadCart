import React, { useState } from 'react';
import '../CSS/modal.css';

const Review = (props) => {
  // 열기, 닫기, 모달 헤더 텍스트를 부모로부터 받아옴
  const { open, close, header, info } = props;
  console.log(info);
  return (
    // 모달이 열릴때 openModal 클래스가 생성된다.
    <div className={open ? 'openModal modal' : 'modal'}>
      {open ? (
        <section style={{maxWidth: "700px"}}>
          <header>
            {header}
            <button className="close" onClick={close}>
              &times;
            </button>
          </header>
          <main>
            {info.poi_info.map(item=>
            <div style={{display: "flex", flexDirection: "row", margin:"10px"}}>
                <div>
                    <a href={item.link} target='_blank' style={{textDecoration: "none", color: "black"}}>
                        <img style={{width:"208px", height:"117px", marginRight:"15px"}} src={item.img}/>
                    </a>
                </div>
                <div>
                    <a href={item.link} target='_blank' style={{textDecoration: "none", color: "black"}}>
                        <strong>{item.title}</strong>
                        <p>{item.content.length > 100 ? item.content.substring(0,100) + "..." : item.content}</p>
                    </a>
                </div>
            </div>
            )}
          </main>
          <footer>
            <button className="close" onClick={close}>
              close
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  );
};

export default Review;