const tg = window.Telegram.WebApp

tg.expand()

const type = new URL(location.href).searchParams.get('direction')

let config = {}


function renderForm() {
    const form = document.getElementsByTagName('form')[0]

    config.names.forEach(name => {

        const div = document.createElement('div')
        div.classList.add('mb-4')

        const label = document.createElement('label')
        label.for = name
        label.innerText = config.data[name].name
        label.classList.add('form-label')

        const input = document.createElement(config.data[name].data.object)

        input.type = config.data[name].data.type
        input.style.fontSize = '2.5vh'
        input.classList.add('form-control-lg')
        input.classList.add('form-control')
        input.id = name
        input.required = config.data[name].data.required


        if (config.data[name].data.pattern) {
            input.pattern = config.data[name].data.pattern
        }
        if (config.data[name].data.value) {
            input.value = config.data[name].data.value
        }
        if (config.data[name].data.max) {
            input.max = config.data[name].data.max
        }
        if (config.data[name].data.min) {
            input.min = config.data[name].data.min
        }

        form.appendChild(div)
        div.appendChild(label)
        div.appendChild(input)
    })

    let btn = document.createElement('button')
    btn.type = 'submit'
    btn.id = 'btn'
    btn.style.width = '100%'
    btn.style.fontSize = '2.5vh'
    btn.classList.add('btn')
    btn.classList.add('btn-primary')
    btn.classList.add('fixed-bottom')
    btn.classList.add('py-5')
    btn.innerText = config.button
    form.appendChild(btn)

    document.getElementsByTagName('h1')[0].innerText = config.title

}

function showNotify(data){
    const class_types = ['success','warning','danger']

    const alert = document.getElementById('alert')
    const title = document.getElementById('h1_title')

    title.innerText = data.message
    alert.classList.add(`alert-${class_types[data.resultCode]}`)
    alert.style.display = 'block'
}

let isSubmit = false
function handleForm() {
    if (isSubmit) return
    isSubmit = true

    let form = {}

    config.names.forEach(name => {
        if (name === 'btn') return

        let elem = document.getElementById(name)
        form[name] = elem.value
    })

    form.direction = type
    form.sign = decodeURIComponent(tg.initData)

    fetch('/api/form/add', {
        'method': 'POST',
        'body': JSON.stringify(form),
        'headers': {'Content-Type': 'application/json'}
    })
        .then(resp => resp.json())
        .then(data => {
            if (data.resultCode === 0) {
                tg.close()
            } else {
                isSubmit = false
                showNotify(data)
            }
        })
}


window.onload = () => {
    fetch(`/api/form/get-form?direction=${type}`)
        .then(resp => resp.json())
        .then(resp => {
            config = resp

            renderForm()
        })
        .catch(e => console.log(e))

}
