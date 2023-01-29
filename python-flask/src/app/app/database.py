import os

from azure.cosmos import CosmosClient, PartitionKey
from flask import current_app, g


def get_db():
    if 'db' not in g:
        cosmos_url = os.environ.get("URI")
        cosmos_key = os.environ.get("PRIMARY_KEY")
        print(cosmos_url, cosmos_key)
        client = CosmosClient(url=cosmos_url, credential=cosmos_key)

        # client.client_connection(url=url, credential=key)
        db_client = client.create_database_if_not_exists("texas")
        partition_key_value = "/id"
        container_name = "texasContainer"
        offer = 400
        container_client = db_client.create_container_if_not_exists(
            id=container_name,
            partition_key=PartitionKey(path=partition_key_value),
            offer_throughput=offer
        )
        g.db = container_client
        g.dbClient = db_client

    return g.db


def close_db(e=None):
    db = g.pop("db", None)

    print("not actually closed")


def init_app(app):
    init_db(app)


def init_db(app):
    with app.app_context():
        db = get_db()


def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
