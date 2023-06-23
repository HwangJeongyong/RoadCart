import React, { useState } from 'react';
import '../CSS/modal.css';

const Modal = (props) => {
  // 열기, 닫기, 모달 헤더 텍스트를 부모로부터 받아옴
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { open, close, header, save } = props;
  return (
    // 모달이 열릴때 openModal 클래스가 생성된다.
    <div className={open ? 'openModal modal' : 'modal'}>
      {open ? (
        <section>
          <header>
            {header} <input type='text' onChange={(e)=>{setTitle(e.target.value)}}></input>
            <button className="close" onClick={close}>
              &times;
            </button>
          </header>
          <main><textarea cols="60" rows="10" onChange={(e)=>{setContent(e.target.value)}}></textarea></main>
          <footer>
            <button className="close" onClick={()=>{save(title, content)}}>
              저장하기
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  );
};

export default Modal;