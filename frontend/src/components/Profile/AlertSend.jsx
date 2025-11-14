import Picker from "emoji-picker-react";
import {FilePicker} from "react-file-picker";
import Uploader from "../Chat/Uploader";
import {useState} from "react";
import {ReactComponent as Smile} from "../../icons/emoji-smile-fill.svg";
import {ReactComponent as Paperclip} from "../../icons/paperclip.svg";
import {ReactComponent as SendFill} from "../../icons/send-fill.svg";
import axios from "axios";
import {apiUrl} from "../../config";
import {getAuthCookie} from "../../modules";

const AlertSend = ({target, setStatus}) => {
    const [message, setMessage] = useState({
        text: '',
        files: []
    })
    const [pickerVisible, setPickerVisible] = useState(false)

    const onEmojiClick = (emojiObject, event) => {
        setMessage(msg => {
            return {
                text: msg.text + emojiObject.emoji,
                files: msg.files
            }
        })
    };
    async function sendMessage() {

        const setHeaders = {
            headers: {
                ...getAuthCookie().headers,
                'Content-Type': 'multipart/form-data'
            }
        }
        axios.post(apiUrl+'/send-notify/',{chat_id:target.id,text:message.text, filenames:message.files},setHeaders).then(resp => {
            setStatus(resp.data)

        })
        setMessage({
            text: '',
            files: []
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
                              rows={4}
                              placeholder="Написать сообщение" onChange={({target: {value}}) => {
                        setMessage(msg => {
                            return {text: value, files: msg.files}
                        })
                    }} value={message.text}/>

                    <FilePicker
                        maxSize={15}
                        onChange={FileObject => (setMessage(msg => {
                            console.log(msg.files)
                            return {
                                text: msg.text,
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
        </>
    )
}
export default AlertSend