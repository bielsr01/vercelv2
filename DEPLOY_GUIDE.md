# Guia de Deploy - BetTracker Pro com Docker + Portainer

## Parte 1: Comprar uma VPS

### Provedores Recomendados (Preços em USD/mês)

| Provedor | Plano Mínimo | RAM | CPU | Armazenamento | Preço |
|----------|--------------|-----|-----|---------------|-------|
| **Hostinger** | VPS 1 | 4GB | 2 vCPU | 50GB NVMe | ~$5.99 |
| **Contabo** | VPS S | 4GB | 4 vCPU | 50GB SSD | ~$6.99 |
| **DigitalOcean** | Basic | 2GB | 1 vCPU | 50GB SSD | ~$12.00 |
| **Hetzner** | CX22 | 4GB | 2 vCPU | 40GB SSD | ~$4.50 |
| **Vultr** | Regular | 2GB | 1 vCPU | 55GB SSD | ~$12.00 |

### Passo a Passo para Comprar (Exemplo: Hostinger)

1. Acesse [hostinger.com.br](https://www.hostinger.com.br/servidor-vps)
2. Escolha o plano **VPS 1** ou superior
3. Selecione o sistema operacional: **Ubuntu 22.04**
4. Escolha a localização: **São Paulo** (melhor para Brasil)
5. Complete o pagamento
6. Você receberá por email:
   - IP do servidor
   - Senha root
   - Porta SSH (geralmente 22)

---

## Parte 2: Configurar a VPS

### 2.1 Conectar via SSH

```bash
# No Windows: use PowerShell, CMD ou PuTTY
# No Mac/Linux: use o Terminal

ssh root@SEU_IP_DO_SERVIDOR
```

### 2.2 Atualizar o Sistema

```bash
apt update && apt upgrade -y
```

### 2.3 Instalar Docker

```bash
# Instalar dependências
apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version
```

### 2.4 Instalar Portainer

```bash
# Criar volume para dados do Portainer
docker volume create portainer_data

# Instalar Portainer
docker run -d \
  -p 8000:8000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

### 2.5 Acessar Portainer

1. Abra no navegador: `https://SEU_IP:9443`
2. Crie uma senha de administrador (mínimo 12 caracteres)
3. Selecione "Local" para gerenciar o Docker local
4. Clique em "Connect"

---

## Parte 3: Fazer Deploy do BetTracker Pro

### 3.1 Preparar os Arquivos

**Opção A: Via Git (Recomendado)**

```bash
# Na VPS, crie uma pasta para o projeto
mkdir -p /opt/bettracker
cd /opt/bettracker

# Clone seu repositório (se estiver no GitHub)
git clone https://github.com/SEU_USUARIO/SEU_REPO.git .
```

**Opção B: Upload Manual via FileZilla/SFTP**

1. Baixe o FileZilla: [filezilla-project.org](https://filezilla-project.org/)
2. Conecte usando:
   - Host: `sftp://SEU_IP`
   - Usuário: `root`
   - Senha: sua senha
   - Porta: `22`
3. Faça upload de todos os arquivos para `/opt/bettracker`

### 3.2 Criar Arquivo de Variáveis de Ambiente

```bash
cd /opt/bettracker
nano .env
```

Cole o seguinte conteúdo (substitua os valores):

```env
# Banco de dados Supabase
SUPABASE_DATABASE_URL=postgresql://postgres.xxxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

# Segredo para sessões (gere um aleatório)
SESSION_SECRET=sua_chave_secreta_muito_longa_aqui_123456
```

Salve com `Ctrl+O`, Enter, `Ctrl+X`

### 3.3 Deploy via Portainer

1. Acesse Portainer: `https://SEU_IP:9443`
2. Vá em **Stacks** no menu lateral
3. Clique em **+ Add stack**
4. Dê um nome: `bettracker`
5. Selecione **Upload** e faça upload do `docker-compose.yml`
6. Em **Environment variables**, adicione:
   - `SUPABASE_DATABASE_URL` = sua URL do Supabase
   - `SESSION_SECRET` = uma chave secreta longa
7. Clique em **Deploy the stack**

### 3.4 Deploy via Linha de Comando (Alternativa)

```bash
cd /opt/bettracker

# Construir a imagem
docker compose build

# Iniciar o container
docker compose up -d

# Ver logs
docker compose logs -f
```

---

## Parte 4: Configurar Domínio e HTTPS (Opcional)

### 4.1 Instalar Nginx Proxy Manager

```bash
# Criar pasta
mkdir -p /opt/nginx-proxy-manager
cd /opt/nginx-proxy-manager

# Criar docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
      - '81:81'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
EOF

# Iniciar
docker compose up -d
```

### 4.2 Configurar Domínio

1. Acesse: `http://SEU_IP:81`
2. Login padrão: `admin@example.com` / `changeme`
3. Mude a senha imediatamente
4. Vá em **Proxy Hosts** > **Add Proxy Host**
5. Configure:
   - Domain: `seudominio.com.br`
   - Forward Hostname: `bettracker` (nome do container)
   - Forward Port: `5000`
   - Enable SSL: Marcar
   - Force SSL: Marcar

---

## Parte 5: Manutenção

### Comandos Úteis

```bash
# Ver containers rodando
docker ps

# Ver logs do BetTracker
docker logs bettracker-pro -f

# Reiniciar container
docker restart bettracker-pro

# Parar container
docker stop bettracker-pro

# Atualizar aplicação
cd /opt/bettracker
git pull
docker compose build
docker compose up -d

# Limpar imagens antigas
docker image prune -a
```

### Backup do Banco de Dados

O banco está no Supabase, então os backups são automáticos. Você pode também exportar manualmente pelo painel do Supabase.

---

## Resumo de Portas

| Serviço | Porta | Acesso |
|---------|-------|--------|
| BetTracker Pro | 5000 | `http://SEU_IP:5000` |
| Portainer | 9443 | `https://SEU_IP:9443` |
| Nginx Proxy Manager | 81 | `http://SEU_IP:81` |
| HTTP | 80 | Via proxy |
| HTTPS | 443 | Via proxy |

---

## Problemas Comuns

### Erro de conexão com banco
- Verifique se a URL do Supabase está correta no `.env`
- Certifique-se de usar a URL com pooler (porta 6543)

### Container não inicia
```bash
docker logs bettracker-pro
```
Verifique os logs para identificar o erro.

### Porta já em uso
```bash
# Verificar o que está usando a porta
lsof -i :5000

# Mudar a porta no docker-compose.yml
ports:
  - "8080:5000"  # Muda para 8080 externamente
```

---

## Suporte

Se precisar de ajuda, verifique:
1. Logs do container: `docker logs bettracker-pro`
2. Status do Docker: `docker ps -a`
3. Espaço em disco: `df -h`
4. Memória: `free -h`
