import { Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import{HttpService} from '@nestjs/axios'
import { lastValueFrom } from 'rxjs';
import { count } from 'console';

 
@Injectable()
export class LocalizacaoService {

    //Injeta o HTTPService no nosso service
    constructor(private readonly httpService:HttpService){}

    //Consulta Cep
    async buscarCep(cep:string){

        //Remove qualquer caractere que não seja um número
        // ex: 01001-000 se torna 01001000
        const cepLimpo = cep.replace(/\D/g, '');

        //Validamos se o cep contem 8 numeros
        if(cepLimpo.length !==8){
            throw new BadRequestException('O cep deve possuir 8 numeros');
        }

        try{
            //Fazemos uma requisição do tipo get para a api externa
            //O httpservice.get vai retornar uma valor Observable
            //Por isso usamos a lastvaluefrom, para tranforma-lo em promise e podermos trabalhar com async/await.
            const resposta = await lastValueFrom(
                this.httpService.get(`https://viacep.com.br/ws/${cepLimpo}/json/`)
            );
            //O conteudo que vem da API externa fica dentro da propriedade "data".
            const dados = resposta.data; 

            //Caso o cep tenha 8 numeros, mas não exista, normalmente o viaCep devolve "erro = true" e nós o tratamos como "notfound" = não encontrado
            if(dados.erro){
                throw new NotFoundException('CEP não encontrado');
            }
            //Não precisamos devolver tudo que o viacep trouxer
            //Podemos escolher quais informções serão exibidas para o usuario
            return{ 
                cep: dados.cep,
                logradouro: dados.logradouro,
                bairro: dados.bairro,
                cidade: dados.localidade,
                estado: dados.uf,
                regiao: dados.regiao
            };
        } catch(erro) {
            if(
            erro instanceof NotFoundException ||
            erro instanceof BadRequestException
        ){
            throw erro;
        }
        throw new ServiceUnavailableException(
            'Não foi possivel consultar o serviço de CEP'
        );
        }
    }
    //Consulta localização por cidade
    async buscarCidade(cidade: string){
        //Evita buscas vazias
        if(!cidade || cidade.trim().length<2){
            throw new BadRequestException('informe uma cidade valida');
        }
        try{ 
            //encodeURIComponent prepara o texto para ser utilizado dentro de uma URL
            //Por exemplo: São paulo, preciso "concerta-lo" para que seja aceito pela URL
            const cidadeCodificada  =encodeURIComponent(cidade.trim());
            //Fazemos a consulta da API de geocoding
            //count:1 = queremos somente o primeiro resultado
            //language: 'pt' = queremos traduzido para o portugues
            //countryCode: 'BR' = pois estamos fazendo uma consulta no Brasil
            const resposta = await lastValueFrom(
                this.httpService.get('https://geocoding-api.open-meteo.com/v1/search',{
                    params:{
                        name: cidade.trim(),
                        count: 1,
                        language: 'pt', 
                        countryCode: 'BR'

                    }
                })
            );
            const dados = resposta.data;
            //A api da geocoding retorna os resultados dentro de "results: [...]"
            //Se não existir resultados ou estiver vazio, significa que nenhuma cidade foi encontrada
            if(!dados.results || dados.results.length == 0 ){
                throw new NotFoundException('Localidade não encontrada');
            }
            //Pegamos o primeiro resultado na posição 0 do vetor
            const localizacao = dados.results[0];
            //Extraimos os dados que são essenciais para nós
            return{
                cidade: localizacao.name,
                estado: localizacao.admin1, //admin1 =estado/região
                pais: localizacao.country,
                latitude: localizacao.latitude,
                longitude: localizacao.longitude
            }
        } catch(erro){
            if(
                erro instanceof NotFoundException ||
                erro instanceof BadRequestException
            ){
                throw erro;
            }
            throw new ServiceUnavailableException(
                ('não foi possivel consultar o serviço de localização')
            )
        }
    } 

    //Coordenadas
    async buscarCepComCoordenadas(cep:string){
        //Primeiro fazemos a busca como cep
        const endereco = await this.buscarCep(cep);
        //Depois usamos a cidade retornada, para consultar a latitude e longetude
        const localizacao = await this.buscarCidade(endereco.cidade);

        return{
            cep:endereco.cep,
            logradouro: endereco.logradouro,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            estado: endereco.estado,
            latitude: localizacao.latitude,
            longitude: localizacao.longitude
        }
    }
}
