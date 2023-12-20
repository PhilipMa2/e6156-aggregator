import os
import json
from flask import Flask, redirect, request, url_for, render_template
from flask_login import (
    LoginManager,
    current_user,
    login_required,
    login_user,
    logout_user,
)

from oauthlib.oauth2 import WebApplicationClient
import requests

from user import User

# Configuration
GOOGLE_CLIENT_ID = '215546816295-c186rvc4j3s5cva875mnlbr18uu0ebb7.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = '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'
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
app.secret_key = os.urandom(24)

login_manager = LoginManager()
login_manager.init_app(app)
client = WebApplicationClient(GOOGLE_CLIENT_ID)

get_student_url = "http://ec2-3-134-96-223.us-east-2.compute.amazonaws.com:5000/students/"

@login_manager.user_loader
def load_user(user_id):
    user_param = User.get(user_id)
    if not user_param:
        return None
    else:
        return User(user_param['id'], user_param['name'], user_param['email'], user_param['profile_pic'], user_param['interest'])

@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('index.html', current_user=current_user)
    else:
        return render_template('login.html')
    
def get_google_provider_cfg():
    return requests.get(GOOGLE_DISCOVERY_URL).json()

@app.route("/login")
def login():
    # Find out what URL to hit for Google login
    google_provider_cfg = get_google_provider_cfg()
    authorization_endpoint = google_provider_cfg["authorization_endpoint"]

    # Use library to construct the request for Google login and provide
    # scopes that let you retrieve user's profile from Google
    request_uri = client.prepare_request_uri(
        authorization_endpoint,
        redirect_uri=request.base_url + "/callback",
        scope=["openid", "email", "profile"],
    )
    return redirect(request_uri)

@app.route("/login/callback")
def callback():
    # Get authorization code Google sent back to you
    code = request.args.get("code")
    # Find out what URL to hit to get tokens that allow you to ask for
    # things on behalf of a user
    google_provider_cfg = get_google_provider_cfg()
    token_endpoint = google_provider_cfg["token_endpoint"]
    # Prepare and send a request to get tokens! Yay tokens!
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=request.url,
        redirect_url=request.base_url,
        code=code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET),
    )

    # Parse the tokens!
    client.parse_request_body_response(json.dumps(token_response.json()))

    # Now that you have tokens (yay) let's find and hit the URL
    # from Google that gives you the user's profile information,
    # including their Google profile image and email
    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body)

    # You want to make sure their email is verified.
    # The user authenticated with Google, authorized your
    # app, and now you've verified their email through Google!
    if userinfo_response.json().get("email_verified"):
        unique_id = userinfo_response.json()["sub"]
        users_email = userinfo_response.json()["email"]
        picture = userinfo_response.json()["picture"]
        users_name = userinfo_response.json()["given_name"]
    else:
        return "User email not available or not verified by Google.", 400
    
    # Create a user in your db with the information provided
    # by Google

    user_db = User.get(unique_id)

    # Doesn't exist? Add it to the database.
    if not user_db:
        User.create(unique_id, users_name, users_email, picture)
        user = User(unique_id, users_name, users_email, picture)
    else:
        user = User(unique_id, users_name, users_email, picture, user_db['interest'])

    # Begin user session by logging the user in
    login_user(user)

    # Send user back to homepage
    return redirect(url_for("index"))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', current_user=current_user)

@app.route('/students/<int:student_id>')
@login_required
def view_student_profile(student_id):
    student_info = User.get(student_id)
    if student_info:
        return (
            "<p>Hello! You're viewing the profile of {}.</p>"
            "<p>Email: {}</p>"
            "<p>Interest: {}</p>"
            "<div><p>Profile Picture:</p>"
            '<img src="{}" alt="Student profile pic"></img></div>'.format(
                student_info['name'], student_info['email'], student_info['interest'], student_info['profile_pic']
            )
        )
    else:
        return "Student not found", 404

@login_manager.unauthorized_handler
def unauthorized():
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run()


