import React from "react";
import { getTime } from "../../modules";
import { get } from "axios";

const Filters = ({ filter, setFilter, roles, directions }) => {

    function filterHandle({ target: { value, name, checked } }) {
        console.log(value, name);
        if (['directions', 'roles'].includes(name)) {
            let array = [...filter[name]];

            if (checked) {
                array.push(value);
            } else {
                array = array.filter(status => status !== value);
            }

            setFilter({
                ...filter,
                [name]: array
            });

        } else {
            setFilter({
                ...filter,
                [name]: value
            });
        }
    }

    return (
        <>
            <div className="offcanvas offcanvas-end p-3" style={{ backgroundColor: '#22222a' }} data-bs-scroll="true"
                data-bs-backdrop="false" tabIndex="-1"
                id="usersFilters" aria-labelledby="usersFiltersLabel">

                <div className="offcanvas-header">
                    <h3>Фильтры</h3>
                    <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas"
                        aria-label="Close"></button>
                </div>
                <div className={'offcanvas-body'}>
                    <div>
                        <div className="mb-3">
                            <label className="form-label">Поиск по Username/ID</label>
                            <input type="text" defaultValue={filter.name} onBlur={filterHandle} name='name'
                                className="form-control" />
                        </div>

                        <div className='mb-3'>
                            <label className="form-label">По направлению</label>
                            <div className="list-group">
                                {directions.map(direction =>
                                    <label key={direction.id} className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox"
                                            defaultChecked={filter.directions.includes(direction.id.toString())} onChange={filterHandle}
                                            value={direction.id.toString()} name='directions' />
                                        {direction.title}
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className='mb-3'>
                            <label className="form-label">По ролям</label>
                            <div className="list-group">
                                {roles.map(role =>
                                    <label key={role.id} className="list-group-item">
                                        <input className="form-check-input me-1" type="checkbox"
                                            defaultChecked={filter.roles.includes(role.id.toString())} onChange={filterHandle}
                                            value={role.id.toString()} name='roles' />
                                        {role.name}
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="input-group mb-3">
                            <label className="form-label">По дате</label>
                            <div className="row">
                                <div className="col ">
                                    С <input type="datetime-local" className="form-control" name={'time_start'} onBlur={filterHandle} />
                                </div>
                                <div className="col mt-3">
                                    До <input type="datetime-local" name={'time_end'} className="form-control" onBlur={filterHandle} />
                                </div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Лимит</label>
                            {/* Здесь вместо селекта поле ввода */}
                            <input 
                                type="number" 
                                name="limit" 
                                defaultValue={filter.limit || 200} 
                                onBlur={filterHandle} 
                                className="form-control" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Filters;
