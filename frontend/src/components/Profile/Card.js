import React from "react";


const Card = ({title, values, value}) => {
    return (

            <div className="card text-center text-bg-dark mb-3" >
                <div className="card-header">{title}</div>
                <div className="card-body ">
                    {value ? <h5 className="card-title ">{value}</h5> : values?.map((val, index) => <h5 key={index} className="card-title"> {val} </h5>)}
                </div>
            </div>

    )
}

export default Card;