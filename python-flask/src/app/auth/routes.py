import uuid
from flask import request, make_response, jsonify
from app.models import User
from auth import auth_bp
from auth.constants import application_json
from auth.utility import find_user, validate_request, find_user_by_name_password
from app import database

users = []


@auth_bp.route('/api/user', methods=["GET", "POST"])
def api_user():
    db = database.get_db()
    if request.method == "GET":
        request_args = request.args
        if len(request_args) == 0:
            res = [item for item in
                   db.query_items(query="SELECT * FROM texasContainer", enable_cross_partition_query=True)]
            # response = make_response([user.to_json() for user in users], 200)
            response = make_response(res, 200)
            response.headers["Content-Type"] = application_json
            return response
        if len(request_args) > 0:
            params = [dict(name="@login", value=request_args["login"])]
            query = "SELECT t.firstname, t.lastname, t.login FROM texasContainer t WHERE t.login = @login"
            result = db.query_items(query=query, parameters=params, enable_cross_partition_query=True)
            response = make_response(
                [result for result in result],
                200
            )
            return response
    if request.method == "POST":
        data = request.get_json()
        errors = validate_request(data, users, db)
        if errors is None:
            user_id = uuid.uuid4()
            new_user = User(login=data["login"], password=data["password"], firstname=data["firstname"],
                            lastname=data["lastname"], userId=user_id)
            db.create_item(new_user.to_json())
            response = make_response(
                jsonify({"id": user_id}),
                200
            )
            response.headers["Content-Type"] = application_json
            return response
        else:
            response = make_response()
            response.data = errors
            response.status = 400
            response.headers["Content-Type"] = application_json
            return response


@auth_bp.route('/api/greeting')
def auth_greet():
    username = request.authorization["username"]
    password = request.authorization["password"]
    params = [{"name": "@login", "value": username}, {"name": "@password", "value": password}]
    query = "SELECT * FROM texasContainer t WHERE t.login=@login AND t._User__password=@password"
    db = database.get_db()
    result = db.query_items(query=query, parameters=params, enable_cross_partition_query=True)
    for item in result:
        user = User(login=item.get("login", ""), firstname=item.get("firstname", ""),
                    lastname=item.get("lastname", ""), password="123", userId="123")
        return make_response(
            user.greet(),
            200
        )
