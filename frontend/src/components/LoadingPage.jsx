import React from "react";

const LoadingPage = () => {
    return (
        <div style={{height:'100vh'}}>
            <div className=' h-100 d-flex align-items-center justify-content-center'>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <h1> Загрузка...</h1>
            </div>
        </div>
    )
}
export default LoadingPage;