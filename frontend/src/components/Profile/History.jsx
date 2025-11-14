import React from "react";

const History = ({history}) => {
    return (
        <>
            <a data-bs-toggle="collapse" href="#history" role="button" aria-expanded="true" aria-controls="10"
               className="text-decoration-none text-white border-bottom"><h3>История бота</h3></a>
            <hr/>
            <div className={'pt-3 pb-2 mb-3 border-bottom multi-collapse collapse'} id={'history'}>
                <div className="table-responsive ">
                    <table className="table table-dark table-hover">
                        <thead>
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Информация</th>

                            <th scope="col">Дата</th>
                        </tr>
                        </thead>
                        <tbody>
                        {history.map(obj =>
                            <tr key={obj.id}>
                                <td>{obj.id}</td>
                                <td>{obj.text}</td>
                                <td>{obj.create_at}</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

        </>
    )
}
export default History;