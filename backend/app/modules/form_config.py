title = 'Запись на курс'


type_settings = {
    'email': {
        'object': 'input',
        'required': True,
        'type': 'text',
        'pattern': '^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$'
    },
    'description': {
        'object': 'textarea',
        'required': True,
        'type':'text',
        'pattern':'',
        'placeholder':"Расскажите о себе"
    }

}

config = {
    'email': 'Электронная почта',
    'description': 'Биография'
}
btn_name = 'Получить курс'

params = {
    'cash': ['email', 'description'],
    'mtt': ['email', 'description'],
    'spin': ['email', 'description'],
}
