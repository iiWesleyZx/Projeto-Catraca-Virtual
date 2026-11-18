#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "secrets.h"

// ========================================
// CONFIGURACOES DE REDE E SUPABASE
// ========================================

const char* WIFI_SSID = WIFI_SSID_PRIVADO;
const char* WIFI_SENHA = WIFI_SENHA_PRIVADA;

const char* AP_SSID = AP_SSID_PRIVADO;
const char* AP_SENHA = AP_SENHA_PRIVADA;

const char* SUPABASE_URL = SUPABASE_URL_PRIVADA;
const char* SUPABASE_KEY = SUPABASE_CHAVE_PUBLICA;

// ========================================
// PINOS
// ========================================

#define TRIG1 25
#define ECHO1 34

#define TRIG2 26
#define ECHO2 33

#define BUZZER 32

// ========================================
// CONFIGURACOES
// ========================================

const float LIMITE_CM = 20.0;

const unsigned long INTERVALO_LEITURA = 50;
const unsigned long TEMPO_BIP = 50;
const unsigned long TEMPO_TRAVESSIA = 1500;
const unsigned long TEMPO_LIVRE = 100;

// Fila de movimentacoes
#define TAMANHO_FILA 20

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
// FILA DO SUPABASE
// ========================================

struct Movimentacao {
  char tipo[8];
};

QueueHandle_t filaSupabase = NULL;

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
  delay(TEMPO_BIP);
  digitalWrite(BUZZER, LOW);

  buzzerLigado = false;
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
// ADICIONAR MOVIMENTACAO NA FILA
// ========================================

void adicionarNaFila(const char* tipo) {

  if (filaSupabase == NULL) {
    Serial.println("ERRO: Fila Supabase nao criada!");
    return;
  }

  Movimentacao movimentacao;

  snprintf(
    movimentacao.tipo,
    sizeof(movimentacao.tipo),
    "%s",
    tipo
  );

  if (
    xQueueSend(
      filaSupabase,
      &movimentacao,
      0
    ) == pdTRUE
  ) {

    Serial.print("Movimentacao adicionada a fila: ");
    Serial.println(tipo);

  } else {

    Serial.println("ERRO: Fila Supabase cheia!");
    Serial.println("Movimentacao nao enfileirada.");
  }
}

// ========================================
// ENVIAR MOVIMENTACAO AO SUPABASE
// EXECUTADA SOMENTE NA TAREFA SEPARADA
// ========================================

bool enviarMovimentacao(const char* tipo) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("Wi-Fi desconectado!");
    return false;
  }

  WiFiClientSecure cliente;

  // Apenas para testes.
  // Em producao, configurar certificado CA.
  cliente.setInsecure();

  HTTPClient http;

  http.setTimeout(5000);

  String url = String(SUPABASE_URL);

  if (url.endsWith("/")) {
    url.remove(url.length() - 1);
  }

  url += "/rest/v1/movimentacoes";

  if (!http.begin(cliente, url)) {

    Serial.println("ERRO: Nao foi possivel iniciar HTTP");
    return false;
  }

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  http.addHeader(
    "apikey",
    SUPABASE_KEY
  );

  http.addHeader(
    "Prefer",
    "return=minimal"
  );

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

  int codigo = http.POST(json);

  Serial.print("Resposta HTTP: ");
  Serial.println(codigo);

  bool sucesso = codigo >= 200 && codigo < 300;

  if (sucesso) {

    Serial.println("SUCESSO: Movimentacao salva!");

  } else {

    Serial.println("ERRO: Falha ao salvar movimentacao.");

    if (codigo < 0) {

      Serial.println(
        http.errorToString(codigo)
      );

    } else {

      Serial.println(http.getString());
    }
  }

  http.end();

  return sucesso;
}

// ========================================
// TAREFA INDEPENDENTE DO SUPABASE
// ========================================

void tarefaSupabase(void* parametro) {

  Movimentacao movimentacao;

  while (true) {

    // Esperar uma movimentacao chegar na fila
    if (
      xQueueReceive(
        filaSupabase,
        &movimentacao,
        portMAX_DELAY
      ) == pdTRUE
    ) {

      Serial.println();
      Serial.println("PROCESSANDO FILA SUPABASE");

      bool sucesso = false;

      // Esperar o Wi-Fi voltar
      while (WiFi.status() != WL_CONNECTED) {

        Serial.println("Aguardando Wi-Fi...");

        vTaskDelay(pdMS_TO_TICKS(1000));
      }

      // Ate 3 tentativas de envio
      for (int tentativa = 1; tentativa <= 3; tentativa++) {

        Serial.print("Tentativa ");
        Serial.print(tentativa);
        Serial.println(" de 3");

        sucesso = enviarMovimentacao(
          movimentacao.tipo
        );

        if (sucesso) {
          break;
        }

        if (tentativa < 3) {

          Serial.println(
            "Aguardando antes de tentar novamente..."
          );

          vTaskDelay(pdMS_TO_TICKS(1000));
        }
      }

      if (!sucesso) {

        Serial.println(
          "ERRO: Movimentacao nao enviada apos 3 tentativas."
        );
      }
    }
  }
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

  // Apenas colocar na fila.
  // Nao esperar resposta do Supabase.
  adicionarNaFila("entrada");
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

  // Apenas colocar na fila.
  adicionarNaFila("saida");
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

  // Ler um sensor por vez
  distancia1 = medirDistancia(TRIG1, ECHO1);

  delay(30);

  distancia2 = medirDistancia(TRIG2, ECHO2);

  detectado1 =
    distancia1 >= 2 &&
    distancia1 <= LIMITE_CM;

  detectado2 =
    distancia2 >= 2 &&
    distancia2 <= LIMITE_CM;

  // Detectar inicio da presenca
  bool novo1 = detectado1 && !anterior1;
  bool novo2 = detectado2 && !anterior2;

  anterior1 = detectado1;
  anterior2 = detectado2;

  switch (estado) {

    case AGUARDANDO:

      if (novo1 && !novo2) {

        estado = ESPERANDO_SENSOR2;
        inicioPassagem = millis();

        Serial.println("Possivel entrada...");

      } else if (novo2 && !novo1) {

        estado = ESPERANDO_SENSOR1;
        inicioPassagem = millis();

        Serial.println("Possivel saida...");

      } else if (novo1 && novo2) {

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;
      }

      break;

    case ESPERANDO_SENSOR2:

      if (novo2) {

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;

        registrarEntrada();

      } else if (
        millis() - inicioPassagem >=
        TEMPO_TRAVESSIA
      ) {

        Serial.println("Entrada cancelada");

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;
      }

      break;

    case ESPERANDO_SENSOR1:

      if (novo1) {

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;

        registrarSaida();

      } else if (
        millis() - inicioPassagem >=
        TEMPO_TRAVESSIA
      ) {

        Serial.println("Saida cancelada");

        estado = ESPERANDO_LIBERAR;
        inicioLivre = 0;
      }

      break;

    case ESPERANDO_LIBERAR:

      // Liberar somente quando ambos estiverem livres
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

          Serial.println(
            "Sistema liberado para nova passagem!"
          );
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
// API LOCAL DO ESP32
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

  // Criar fila antes de iniciar a tarefa
  filaSupabase = xQueueCreate(
    TAMANHO_FILA,
    sizeof(Movimentacao)
  );

  if (filaSupabase == NULL) {

    Serial.println("ERRO AO CRIAR FILA SUPABASE!");

  }

  // Permitir rede propria e Wi-Fi externo
  WiFi.mode(WIFI_AP_STA);

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

      Serial.println("Wi-Fi conectado!");

      Serial.print("IP local: ");
      Serial.println(WiFi.localIP());

      Serial.println(
        "Supabase pronto para receber envios."
      );

    } else {

      Serial.println("Wi-Fi nao conectado!");
    }
  }

  // API local
  servidor.on(
    "/api/status",
    responderStatus
  );

  servidor.begin();

  Serial.println("Servidor local iniciado!");

  // Iniciar tarefa independente do Supabase
  if (filaSupabase != NULL) {

    BaseType_t resultado = xTaskCreatePinnedToCore(
      tarefaSupabase,
      "TarefaSupabase",
      8192,
      NULL,
      1,
      NULL,
      0
    );

    if (resultado == pdPASS) {

      Serial.println(
        "Tarefa Supabase iniciada!"
      );

    } else {

      Serial.println(
        "ERRO AO INICIAR TAREFA SUPABASE!"
      );
    }
  }

  Serial.println("Sistema pronto!");
}

// ========================================
// LOOP
// ========================================

void loop() {

  servidor.handleClient();

  // Leitura continua dos sensores
  servidor.handleClient();

  atualizarSensores();

  atualizarBuzzer();

  // Recuperar conexao Wi-Fi
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
