//Configuração inicial do mapa

//Aqui estamos definindo a posição inicial do mapa(Brasil)
const mapa = L.map('mapa').setView([-14.235, -51.9253], 4);

//adicionamos as imagens de mapa que vem do openstreetmap
L.titleLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(mapa);

//variavel que armazenará o marcador atual. (como um pim de mapa)
let marcador;

// ELEMENTOS DO HTML
const inputCep = document.getElementById('cep');
const btnBuscar = document.getElementById('btnbuscar');
const btnLocalizacao = document.getElementById('btnLocalizacao');
const mensagem = document.getElementById('mensagem');

//BUSCAR CEP
//Aqui estamos adicionando um evento ao botão de buscar
btnBuscar.addEventListener('click', async() => {
    //Retiramos os espaços em branco
    const cep = inputCep.valeu.trim();
    //limpamos a mensagem
    mensagem.textContent = '';
    //validamos se o cep realmente foi informado
    if(!cep){
        mensagem.textContent = 'informe um cep';
        return;
    }
    try{
        //nossa aplicação frontend vai fazer a consulta para a nossa API
        const resposta = await fetch(`http://localhost:3000/localizacap/cep/${cep}/coordenadas`);
         
        // convertemos a resposta da API para JSON
        const dados = await resposta.json()
        //Se a api retornar ERRO (como o 400 ou o 404), nós devolvemos uma resposta.
        if(!resposta.ok){
            throw new Error(dados.mensagem || "Não foi possivel realizar a consulta");
        }
        //Vamos mostrar os dados na tela
        //preencherInformações(dados);
        //(ainda não criamos)

        //Vamos atualizar o mapa com as novas informções
        //AtualizarMapa(
        //dados.latitude,
        //dados.longetude,
        //`${dados.logradouro} - ${dados.cidade}`
        //);
        //ainda não criamos
    }catch(erro){
        mensagem.textContent = erro.message;
    }
})