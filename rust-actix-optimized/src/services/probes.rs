use actix_web::{get, HttpResponse};

#[get("/ops/start")]
async fn get_startup() -> HttpResponse {
    HttpResponse::Ok().body("{\"ok\":true}")
}

#[get("/ops/ready")]
async fn get_readiness() -> HttpResponse {
    HttpResponse::Ok().body("{\"ok\":true}")
}

#[get("/ops/live")]
async fn get_liveness() -> HttpResponse {
    HttpResponse::Ok().body("{\"ok\":true}")
}
