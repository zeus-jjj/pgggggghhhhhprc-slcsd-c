import AlertForm from "./AlertForm";
import {useState, useEffect} from "react";
import axios from "axios";
import {apiUrl} from "../../config";
import {getAuthCookie} from "../../modules";

const Alerts = () => {



    return (
        <div className={'container'}>
            <AlertForm/>
            <div>

            </div>
        </div>
    )
}
export default Alerts;
