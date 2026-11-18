
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "secrets.h"

// ========================================
// CONFIGURACOES DE REDE E SUPABASE
// ========================================

// Wi-Fi com acesso a internet
const char* WIFI_SSID = WIFI_SSID_PRIVADO;
const char* WIFI_SENHA = WIFI_SENHA_PRIVADA;

// Rede propria criada pelo ESP32
const char* AP_SSID = AP_SSID_PRIVADO;
const char* AP_SENHA = AP_SENHA_PRIVADA;

// Conexao direta com o Supabase
const char* SUPABASE_URL = SUPABASE_URL_PRIVADA;
const char* SUPABASE_KEY = SUPABASE_CHAVE_PUBLICA;

// ========================================
// PINOS
// ========================================

// Sensor 1
#define TRIG1 25
#define ECHO1 34

// Sensor 2
#define TRIG2 26
#define ECHO2 33

// Buzzer
#define BUZZER 32

// ========================================
// CONFIGURACOES
// ========================================

const float LIMITE_CM = 20.0;

const unsigned long INTERVALO_LEITURA = 100;
const unsigned long TEMPO_BIP = 50;
const unsigned long TEMPO_TRAVESSIA = 3000;
const unsigned long TEMPO_LIVRE = 300;

// ========================================
// VARIAVEIS
// ========================================

WebServer servidor(80);

float distancia1 = -1;
float distancia2 = -1;

bool detectado1 = false;
bool detectado2 = false;

bool anterior1 = false;
bool anterior2 = false;

bool buzzerLigado = false;

unsigned long ultimoSensor = 0;
unsigned long inicioBip = 0;
unsigned long inicioPassagem = 0;
unsigned long inicioLivre = 0;

unsigned long entradas = 0;
unsigned long saidas = 0;

// ========================================
// ESTADOS DA PASSAGEM
// ========================================

enum EstadoPassagem {
  AGUARDANDO,
  ESPERANDO_SENSOR2,
  ESPERANDO_SENSOR1,
  ESPERANDO_LIBERAR
};

EstadoPassagem estado = AGUARDANDO;

// ========================================
// MEDIR DISTANCIA
// ========================================

float medirDistancia(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);

  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  unsigned long tempo = pulseIn(echo, HIGH, 25000);

  if (tempo == 0) {
    return -1;
  }

  return tempo * 0.0343 / 2.0;
}

// ========================================
// BUZZER
// ========================================

void iniciarBip() {
  digitalWrite(BUZZER, HIGH);

  buzzerLigado = true;
  inicioBip = millis();
}

void atualizarBuzzer() {
  if (
    buzzerLigado &&
    millis() - inicioBip >= TEMPO_BIP
  ) {
    digitalWrite(BUZZER, LOW);
    buzzerLigado = false;
  }
}

// ========================================
// ENVIAR DIRETAMENTE AO SUPABASE
// ========================================

void enviarMovimentacao(const char* tipo) {

  // A rede propria do ESP32 nao fornece
  // internet. Precisamos do Wi-Fi externo.
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(
      "ERRO: ESP32 sem Wi-Fi com internet!"
    );
    return;
  }

  WiFiClientSecure cliente;

  // SOMENTE PARA TESTES:
  // Desativa a validacao do certificado TLS.
  // Para uso definitivo, configurar CA valida.
  cliente.setInsecure();

  HTTPClient http;

  http.setTimeout(5000);

  // Endpoint REST da tabela existente
  String url = String(SUPABASE_URL);

  if (url.endsWith("/")) {
    url.remove(url.length() - 1);
  }

  url += "/rest/v1/movimentacoes";

  if (!http.begin(cliente, url)) {
    Serial.println(
      "ERRO: Nao foi possivel iniciar HTTP"
    );
    return;
  }

  // Cabecalhos exigidos pela API REST
  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.addHeader(
    "apikey",
    SUPABASE_KEY
  );

  // Nao solicitar retorno das linhas,
  // pois anon nao possui permissao SELECT.
  http.addHeader(
    "Prefer",
    "return=minimal"
  );

  // Dados enviados para a tabela
  String json = "{";

  json += "\"dispositivo_id\":\"esp32-01\",";
  json += "\"tipo\":\"";
  json += tipo;
  json += "\",";
  json += "\"quantidade\":1";

  json += "}";

  Serial.println();
  Serial.println("========================");
  Serial.println("ENVIANDO PARA SUPABASE");
  Serial.println("========================");

  Serial.print("Tipo: ");
  Serial.println(tipo);

  Serial.print("JSON: ");
  Serial.println(json);

  // Enviar registro
  int codigo = http.POST(json);

  Serial.print("Resposta HTTP: ");
  Serial.println(codigo);

  // PostgREST retorna normalmente 201
  // quando o INSERT e realizado.
  if (codigo == 201) {

    Serial.println(
      "SUCESSO: Movimentacao salva!"
    );

  } else {

    Serial.println(
      "ERRO: Falha ao salvar movimentacao."
    );

    if (codigo < 0) {
      Serial.println(
        http.errorToString(codigo)
      );
    } else {
      Serial.println(http.getString());
    }
  }

  http.end();
}

// ========================================
// REGISTRAR ENTRADA
// ========================================

void registrarEntrada() {

  entradas++;

  iniciarBip();

  Serial.println();
  Serial.println("ENTRADA DETECTADA!");

  Serial.print("Total de entradas: ");
  Serial.println(entradas);

  enviarMovimentacao("entrada");
}

// ========================================
// REGISTRAR SAIDA
// ========================================

void registrarSaida() {

  saidas++;

  iniciarBip();

  Serial.println();
  Serial.println("SAIDA DETECTADA!");

  Serial.print("Total de saidas: ");
  Serial.println(saidas);

  enviarMovimentacao("saida");
}

// ========================================
// CONTROLE DOS SENSORES
// ========================================

void atualizarSensores() {

  unsigned long agora = millis();

  if (
    agora - ultimoSensor < INTERVALO_LEITURA
  ) {
    return;
  }

  ultimoSensor = agora;

  // Ler um sensor por vez para reduzir
  // interferencia entre ultrassonicos
  distancia1 = medirDistancia(TRIG1, ECHO1);

  delay(30);

  distancia2 = medirDistancia(TRIG2, ECHO2);

  detectado1 =
    distancia1 >= 2 &&
    distancia1 <= LIMITE_CM;

  detectado2 =
    distancia2 >= 2 &&
    distancia2 <= LIMITE_CM;

  // Detectar apenas o inicio da presenca
  bool novo1 = detectado1 && !anterior1;
  bool novo2 = detectado2 && !anterior2;

  anterior1 = detectado1;
  anterior2 = detectado2;

  switch (estado) {

    case AGUARDANDO:

      if (novo1 && !novo2) {

        estado = ESPERANDO_SENSOR2;
        inicioPassagem = millis();

        Serial.println(
          "Possivel entrada..."
        );

      } else if (novo2 && !novo1) {

        estado = ESPERANDO_SENSOR1;
        inicioPassagem = millis();

        Serial.println(
          "Possivel saida..."
        );

      } else if (novo1 && novo2) {

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;
      }

      break;

    case ESPERANDO_SENSOR2:

      if (novo2) {

        // Confirmou sensor 1 -> sensor 2
        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;

        registrarEntrada();

      } else if (
        millis() - inicioPassagem >=
        TEMPO_TRAVESSIA
      ) {

        Serial.println(
          "Entrada cancelada"
        );

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;
      }

      break;

    case ESPERANDO_SENSOR1:

      if (novo1) {

        // Confirmou sensor 2 -> sensor 1
        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;

        registrarSaida();

      } else if (
        millis() - inicioPassagem >=
        TEMPO_TRAVESSIA
      ) {

        Serial.println(
          "Saida cancelada"
        );

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;
      }

      break;

    case ESPERANDO_LIBERAR:

      // So permite nova passagem quando
      // os dois sensores estiverem livres
      if (!detectado1 && !detectado2) {

        if (inicioLivre == 0) {
          inicioLivre = millis();
        }

        if (
          millis() - inicioLivre >=
          TEMPO_LIVRE
        ) {

          estado = AGUARDANDO;
          inicioLivre = 0;
        }

      } else {

        inicioLivre = 0;
      }

      break;
  }
}

// ========================================
// ESTADO DA CATRACA
// ========================================

String textoEstado() {

  switch (estado) {

    case AGUARDANDO:
      return "Aguardando passagem";

    case ESPERANDO_SENSOR2:
      return "Possivel entrada";

    case ESPERANDO_SENSOR1:
      return "Possivel saida";

    case ESPERANDO_LIBERAR:
      return "Aguardando liberar sensores";
  }

  return "Desconhecido";
}

// ========================================
// API LOCAL DO ESP32 - SEM HTML
// ========================================

void responderStatus() {

  String json = "{";

  json += "\"distancia1\":";
  json += distancia1 < 0
    ? "null"
    : String(distancia1, 1);

  json += ",\"distancia2\":";
  json += distancia2 < 0
    ? "null"
    : String(distancia2, 1);

  json += ",\"detectado1\":";
  json += detectado1
    ? "true"
    : "false";

  json += ",\"detectado2\":";
  json += detectado2
    ? "true"
    : "false";

  json += ",\"entradas\":";
  json += String(entradas);

  json += ",\"saidas\":";
  json += String(saidas);

  json += ",\"presentes\":";
  json += String(
    (long)entradas - (long)saidas
  );

  json += ",\"wifi_conectado\":";
  json += WiFi.status() == WL_CONNECTED
    ? "true"
    : "false";

  json += ",\"estado\":\"";
  json += textoEstado();
  json += "\"";

  json += "}";

  servidor.send(
    200,
    "application/json",
    json
  );
}

// ========================================
// SETUP
// ========================================

void setup() {

  Serial.begin(115200);

  // Configurar sensores
  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);

  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);

  // Configurar buzzer
  pinMode(BUZZER, OUTPUT);

  digitalWrite(TRIG1, LOW);
  digitalWrite(TRIG2, LOW);
  digitalWrite(BUZZER, LOW);

  // Permitir rede propria e Wi-Fi externo
  WiFi.mode(WIFI_AP_STA);

  // Criar rede propria
  WiFi.softAP(
    AP_SSID,
    AP_SENHA
  );

  Serial.println();
  Serial.println("========================");
  Serial.println("CATRACA VIRTUAL ESP32");
  Serial.println("========================");

  Serial.print("Rede propria: ");
  Serial.println(AP_SSID);

  Serial.print("IP da rede propria: ");
  Serial.println(WiFi.softAPIP());

  // Conectar ao Wi-Fi com internet
  if (strlen(WIFI_SSID) > 0) {

    Serial.print("Conectando ao Wi-Fi: ");
    Serial.println(WIFI_SSID);

    WiFi.begin(
      WIFI_SSID,
      WIFI_SENHA
    );

    unsigned long inicio = millis();

    while (
      WiFi.status() != WL_CONNECTED &&
      millis() - inicio < 15000
    ) {
      delay(250);
      Serial.print(".");
    }

    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {

      Serial.println(
        "Wi-Fi conectado!"
      );

      Serial.print("IP local: ");
      Serial.println(WiFi.localIP());

      Serial.println(
        "Supabase pronto para receber envios."
      );

    } else {

      Serial.println(
        "Wi-Fi nao conectado!"
      );
    }
  }

  // API local para consultar sensores
  servidor.on(
    "/api/status",
    responderStatus
  );

  servidor.begin();

  Serial.println(
    "Servidor local iniciado!"
  );

  Serial.println(
    "Sistema pronto!"
  );
}

// ========================================
// LOOP
// ========================================

void loop() {

  servidor.handleClient();

  atualizarSensores();

  atualizarBuzzer();

  // Tentar recuperar conexao Wi-Fi
  // se ela cair durante o funcionamento
  static unsigned long ultimaTentativa = 0;

  if (
    WiFi.status() != WL_CONNECTED &&
    millis() - ultimaTentativa >= 10000
  ) {

    ultimaTentativa = millis();

    if (strlen(WIFI_SSID) > 0) {
      Serial.println(
        "Tentando reconectar Wi-Fi..."
      );

      WiFi.reconnect();
    }
  }
}
