import Picker from "emoji-picker-react";
import {FilePicker} from "react-file-picker";
import Uploader from "../Chat/Uploader";
import {useEffect, useState} from "react";
import {ReactComponent as Smile} from "../../icons/emoji-smile-fill.svg";
import {ReactComponent as Paperclip} from "../../icons/paperclip.svg";
import {ReactComponent as SendFill} from "../../icons/send-fill.svg";
import axios from "axios";
import {apiUrl} from "../../config";
import {getAuthCookie} from "../../modules";

const AlertSend = ({setStatus}) => {

    const [directions, setDirection] = useState([])
    const [message, setMessage] = useState({
        text: '',
        files: [],
        directions: []
    })
    const [pickerVisible, setPickerVisible] = useState(false)

    useEffect(() => {
        axios.get(apiUrl+'/config/directions', getAuthCookie())
            .then(resp => setDirection(resp.data))
    }, [])

    const onEmojiClick = (emojiObject, event) => {
        setMessage(msg => {
            return {
                text: msg.text + emojiObject.emoji,
                files: msg.files
            }
        })
    };

    const directionHandle = ({target: {value, checked}}) => {

        const new_directions = checked ? [...message.directions, value] : [...message.directions].filter(obj => obj !== value)
        console.log(new_directions)
        setMessage(obj => {
            return {
              ...obj,
              directions: new_directions
            }
        })

    }

    async function sendMessage() {
        const isConfirm = window.confirm('Вы уверены что хотите отправить уведомление?')

        if (!isConfirm) return

        const setHeaders = {
            headers: {
                ...getAuthCookie().headers,
                'Content-Type': 'multipart/form-data'
            }
        }
        axios.post(apiUrl+'/send-notify/group',{text:message.text, filenames:message.files, 'directions[]': message.directions},setHeaders).then(resp => {
            setMessage({
                text: '',
                files: [],
                directions: [...message.directions]
            })
            setStatus(resp.data)
        })


    }
    return (
        <>
            <div className={'mx-auto'}>

                {pickerVisible && <div style={{position: 'absolute', end: '1000px', bottom: '250px'}}><Picker
                    onEmojiClick={onEmojiClick}/></div>}

                <div
                    className="card-footer text-muted d-flex justify-content-start align-items-center px-3 border rounded-3">
                    <a className={`m-2 ${!pickerVisible && "text-muted"}`} href="#" onClick={() => {
                        setPickerVisible(state => !state)
                    }}> <Smile/></a>

                    <textarea className=" mx-1 form-control form-control-lg border rounded-3 m-3"
                              style={{borderColor: 'transparent'}}
                              id="exampleFormControlInput1"
                              rows={15}
                              placeholder="Написать сообщение" onChange={({target: {value}}) => {
                        setMessage(msg => {
                            return {...msg, text: value}
                        })
                    }} value={message.text}/>

                    <FilePicker
                        maxSize={15}
                        onChange={FileObject => (setMessage(msg => {
                            return {
                                ...msg,
                                files: [...msg.files, FileObject]
                            }
                        }))}
                        onError={errMsg => (console.log(errMsg))}
                    >
                        <a className="ms-1 text-muted" href="#"><Paperclip/></a>
                    </FilePicker>
                    <a className="ms-3 text-muted" href="#" onClick={sendMessage}><SendFill/></a>
                </div>
                <Uploader setMessage={setMessage} files={message.files}/>
            </div>
            <div className="btn-group mt-3" role="group" aria-label="Basic checkbox toggle button group">
                <div className={'btn-group'}>
                <input type="checkbox" name='direction' value='all' className="btn-check" id='all' autoComplete="off" onChange={directionHandle}/>
                <label className="btn btn-outline-warning" htmlFor='all'>Всем</label>
                </div>
                {directions?.map(
                    direction => <div className={'btn-group'} key={direction.id}>
                        <input type="checkbox" name='direction' value={direction.code} className="btn-check" id={direction.id} autoComplete="off" onChange={directionHandle}/>
                        <label className="btn btn-outline-primary" htmlFor={direction.id}>{direction.title}</label>
                    </div>
                )}
            </div>
        </>
    )
}
export default AlertSend