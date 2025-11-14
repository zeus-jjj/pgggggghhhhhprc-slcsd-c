import React from "react";

const Filters = ({filter, setFilter}) => {

    function sortHandle({target:{value, checked}}) {
        setFilter({
            ...filter,
            [value]: checked
        })
    }
    function filterHandle({target:{value, name, checked}}) {
        if (name==='status') {
            let array = [...filter.statuses]

            if (checked) {
                array.push(value)
            } else {
                array = array.filter(status => status !== value)
            }

            setFilter({
                ...filter,
                statuses: array
            })

        } else {
            setFilter({
                ...filter,
                [name]:value
            })
        }
    }

    return (
        <>

        <div className="offcanvas offcanvas-end p-3" style={{backgroundColor:'#22222a'}} data-bs-scroll="true" data-bs-backdrop="false" tabIndex="-1"
             id="ticketFilters" aria-labelledby="ticketFiltersLabel">

            <div className="offcanvas-header">
                <h3>Фильтры</h3>
                <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas"
                        aria-label="Close"></button>
            </div>
            <div className={'offcanvas-body'}>
                <div>
                <div className="mb-3">
                    <label className="form-label">Поиск по номеру</label>
                    <input type="number" defaultValue={filter.number} onBlur={filterHandle} name='id' className="form-control"/>

                </div>

                <div className="mb-3">
                    <label className="form-label">Лимит</label>
                    <select  defaultValue={filter.limit} onChange={filterHandle} name='limit' className="form-control">
                        {[50,100,250, 500].map((val, index) => {
                            return (
                                <option value={val} key={index} defaultChecked={filter.limit === val}>{val}</option>
                            )
                        })}
                    </select>

                </div>

            </div>
            <h3 className={'mt-5'}>Сортировать</h3>

            <div className="form-check">
                <input className="form-check-input" type="checkbox" defaultChecked={filter.sort_by_new} onChange={sortHandle} value="sort_by_new"/>
                <label className="form-check-label" >
                    Сначала новые
                </label>
            </div>
        </div>
            </div>
        </>
    )
}

export default Filters;