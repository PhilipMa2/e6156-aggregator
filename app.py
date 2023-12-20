import os
import json
import asyncio
from flask import Flask, redirect, request, url_for, render_template, flash
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
from report import Report
from team import Team

# Configuration
GOOGLE_CLIENT_ID = '215546816295-c186rvc4j3s5cva875mnlbr18uu0ebb7.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = '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'
GOOGLE_DISCOVERY_URL = (
    "https://accounts.google.com/.well-known/openid-configuration"
)


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
app.secret_key = 'secret'

login_manager = LoginManager()
login_manager.init_app(app)
client = WebApplicationClient(GOOGLE_CLIENT_ID)

@login_manager.user_loader
def load_user(user_id):
    user_param = User.get(user_id)
    if not user_param:
        return None
    else:
        return User.from_json(user_param, app.config['SECRET_KEY'])

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
        user = User(unique_id, users_name, users_email, picture, app.config['SECRET_KEY'])
    else:
        user = User.from_json(user_db, app.config['SECRET_KEY'])

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
def profile():
    # api_gateway_url = 'https://vbl4o4u9yj.execute-api.us-east-2.amazonaws.com'
    # api_gateway_endpoint = '/profile'
    # token = current_user.token if hasattr(current_user, 'token') else 'random token'
    # print(token)
    # headers = {
    #     'authorizationToken': f'Bearer {token}',
    #     'Content-Type': 'application/json'
    # }

    # try:
    #     response = requests.get(api_gateway_url + api_gateway_endpoint, headers=headers)

    #     if response.status_code == 200 and response.json().get('principalId') == current_user.id:
    teams_applied = Team.get(current_user.id, 'applied')
    teams_received = Team.get(current_user.id, 'received')
    teams_formed = Team.get(current_user.id, 'formed')
    teams_applied = [Team.from_json(team, app.config['SECRET_KEY']) for team in teams_applied]
    teams_received = [Team.from_json(team, app.config['SECRET_KEY']) for team in teams_received]
    teams_formed = [Team.from_json(team, app.config['SECRET_KEY']) for team in teams_formed]
    return render_template('profile.html', current_user=current_user, allow_delete=True, teams_applied=teams_applied, teams_received=teams_received, teams_formed=teams_formed)
    #     print(current_user.id)
    #     print(response.json())
        
    #     print(f"API Gateway authorization failed. Status code: {response.status_code}")
    #     return redirect(url_for('index'))
    # except requests.exceptions.RequestException as e:
    #     print(f"Error during API Gateway authorization: {e}")
    #     return "Authorization error", 500
        


@app.route('/students/<string:student_id>')
@login_required
def view_student_profile(student_id):
    student_info = User.get(student_id)
    if student_info:
        user = User.from_json(student_info, app.config['SECRET_KEY'])
        return render_template('profile.html', current_user=user, allow_delete=False)
    else:
        return "Student not found", 404
    

@app.route('/delete_profile', methods=['POST'])
@login_required
def delete_profile():
    User.delete(current_user.id)
    logout_user()
    return redirect(url_for('index'))

@app.route('/update_interest', methods=['POST'])
@login_required
def update_interest():
    if current_user.is_authenticated:
        new_interest = request.form.get('new_interest')
        User.update(current_user.id, new_interest)

        return redirect(url_for('profile'))
    return redirect(url_for('login'))

@app.route('/reports')
def reports():
    reports = Report.get_reports()
    return render_template('reports.html', reports=reports)

@app.route('/write_report', methods=['GET', 'POST'], endpoint='write_report')
@login_required
def write_report():
    if request.method == 'POST':
        issue = request.form.get('issue')
        description = request.form.get('description')
        Report.create(issue, description, current_user.id)

        return redirect(url_for('reports'))
    return render_template('write_report.html')

@app.route('/report/<int:report_id>', methods=['GET'], endpoint='view_report')
@login_required
def view_report(report_id):
    report = Report.get(report_id)
    if report:
        return render_template('view_report.html', report=report)
    else:
        print('Unknown report')
        return redirect(url_for('reports'))
    
@app.route('/delete_report/<int:report_id>', methods=['POST'], endpoint='delete_report')
@login_required
def delete_report(report_id):
    Report.delete(report_id, current_user.id)

    return redirect(url_for('reports'))

@app.route('/update_report/<int:report_id>', methods=['POST'], endpoint='update_report')
@login_required
def update_report(report_id):
    report = Report.get(report_id)
    updated_title = request.form.get('title') or report['issue']
    updated_description = request.form.get('description') or report['description']
    Report.update(report_id, updated_title, updated_description, current_user.id)

    return redirect(url_for('view_report', report_id=report_id))

@app.route('/create_team/<string:requestee_id>', methods=['POST'])
@login_required
def create_team(requestee_id):
    if Team.create(current_user.id, requestee_id):
        flash('Team application sent!', 'success')
    else:
        flash('Team application failed. You have already applied.', 'error')
    return redirect(url_for('view_student_profile', student_id=requestee_id))

@app.route('/confirm_team/<int:team_id>', methods=['POST'])
@login_required
def confirm_team(team_id):
    Team.confirm(team_id)
    return redirect(url_for('profile'))

@app.route('/delete_team/<int:team_id>', methods=['POST'])
@login_required
def delete_team(team_id):
    Team.delete(team_id)
    return redirect(url_for('profile'))

@app.route('/sync')
def synchronous_call():
    user_id = '113490274861503125298'
    print(User.get(user_id))
    print(Team.get(user_id, 'applied'))
    print(Report.get(1))
    return redirect(url_for('index'))

@app.route('/async')
async def asynchronous_call():
    user_id = '113490274861503125298'
    tasks = [
        User.get_async(user_id),
        Team.get_async(user_id, 'applied'),
        Report.get_async(1)
    ]
    for task in asyncio.as_completed(tasks):
        result = await task
        print(result)
    return redirect(url_for('index'))

@login_manager.unauthorized_handler
def unauthorized():
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run()


