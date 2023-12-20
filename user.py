from flask_login import UserMixin
import requests
import datetime
import jwt
import httpx

class User(UserMixin):
    private_student_url = "http://127.0.0.1:2000/students/"
    student_url = "http://ec2-3-134-96-223.us-east-2.compute.amazonaws.com:5000/students/"

    def __init__(self, id_, name, email, profile_pic, key, interest=None):
        def generate_token():
            payload = {
                'sub': id_,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
            }
            token = jwt.encode(payload, key, algorithm='HS256')
            return token
        
        self.id = id_
        self.name = name
        self.email = email
        self.profile_pic = profile_pic
        self.interest = interest
        self.token = generate_token()

    @staticmethod
    async def get_async(user_id):
        async with httpx.AsyncClient() as client:
            response = await client.get(User.student_url + user_id)
            return response.json()

    @staticmethod
    def from_json(user_dict, key):
        user_id = user_dict.get('id')
        user_name = user_dict.get('name')
        user_email = user_dict.get('email')
        user_interest = user_dict.get('interest')
        user_profile_pic = user_dict.get('profile_pic')
        return User(user_id, user_name, user_email, user_profile_pic, key, user_interest)

    @staticmethod
    def get(user_id):
        get_student_url = User.student_url + user_id
        response = requests.get(get_student_url)
        if response.status_code == 404:
            return False
        return response.json()

    @staticmethod
    def create(id_, name, email, profile_pic):
        student = {'id': id_, 'name': name, 'email': email, 'profile_pic': profile_pic}
        create_student_url = User.student_url + 'new'
        response = requests.post(create_student_url, json=student)

        if response.status_code == 201:
            print('Student created successfully!')
        else:
            print('Student creation failed')
            print('Response: ', response.text)

    @staticmethod
    def delete(user_id):
        delete_student_url = User.student_url + user_id
        response = requests.delete(delete_student_url)
        if response.status_code == 404:
            print(response.json()['message'])
        else:
            print('Student deleted')
    
    @staticmethod
    def update(user_id, interest):
        student = {'id': user_id, 'interest': interest}
        update_student_url = User.student_url + user_id
        response = requests.put(update_student_url, json=student)

        if response.status_code == 404:
            print('Student update failed')
        else:
            print('Student updated successfully')
