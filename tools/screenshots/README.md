# Prints da MAW para o site

Refaz os prints de `src/assets/screens/` com o projeto demo "Noite Roxa".

**Atenção:** a automação toma o mouse e o teclado do PC por uns 10 minutos, e a MAW cria `%APPDATA%\MAW\MAW.settings`.

1. `python tools/screenshots/make_demo.py`: gera o áudio sintetizado e `Noite Roxa.maw`, em `Music\MAW Demo` (um WAV por clipe, offset 0).
2. Abrir a MAW de Release. `tools/screenshots/maw.ps1` tem as ações `launch`, `click -X -Y`, `keys`, `scroll`, `capture -Out` e `kill`. As coordenadas são físicas e valem para uma tela 1920×1080 com escala de 125%.
3. Carregar o projeto (MENU → Load Project), ajustar o zoom (MENU → Ajustar zoom ao projeto) e capturar as telas:
   - arranjo tocando o refrão
   - mixer
   - piano roll das TECLAS
   - painel do AutoTune
   - EQ depois do Smart Mix
   - Smart Mix
   - Conselheiro
   - menu da IA
   - METRO
   - exportação
   - desempenho do motor
   - testes (**depois** dos testes a MAW perde o visual, então reinicie)
4. Recortar: janelas inteiras `(0, 0, 1920, 1020)`; os diálogos, pelas caixas usadas em 27/09/2026 (ver histórico do repo).
5. Copiar para `src/assets/screens/` com os mesmos nomes e rodar `npm run build`.

Enquanto a MAW não corrigir os bugs 4 (BPM ao abrir projeto) e 6 ("TOCANDO" cortado), o campo de BPM e o estado do relógio podem sair errados nos prints.
