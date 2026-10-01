/**
 * Banco de Perguntas para "Apenas Um Show: Pancadaria"
 * Categorias:
 * - apenas_um_show (Curiosidades e episódios da série)
 * - conhecimentos_gerais (Cultura geral e ciência cotidiana)
 * - games_e_pop (Jogos, animes e desenhos animados)
 * - ciencia_maluca (Física espacial, teorias e bizarrices)
 */

export const QUESTION_CATEGORIES = {
    todas: "Todas as Categorias (Misturado)",
    apenas_um_show: "Apenas Um Show (Lore & Parque)",
    conhecimentos_gerais: "Conhecimentos Gerais",
    games_e_pop: "Cultura Pop & Games",
    ciencia_maluca: "Ciência Maluca & Universo"
};

export const QUESTIONS_DB = [
    // --- APENAS UM SHOW ---
    {
        category: "apenas_um_show",
        question: "Qual é o animal do Mordecai em Apenas Um Show?",
        options: ["Gaivota", "Gaio-azul (Blue Jay)", "Corvo", "Pica-pau"],
        answer: 1,
        fact: "Mordecai é um gaio-azul de 23 anos que adora jogar videogame e fugir do trabalho!"
    },
    {
        category: "apenas_um_show",
        question: "Qual objeto/máquina é o chefe Benson no parque?",
        options: ["Máquina de Chicletes", "Máquina de Refrigerante", "Cafeteira", "Pá de Lixo"],
        answer: 0,
        fact: "Benson é uma máquina de chicletes que fica vermelho de raiva quando Mordecai e Rigby não trabalham!"
    },
    {
        category: "apenas_um_show",
        question: "Qual é a técnica de socos rítmicos no peito criada por Rigby?",
        options: ["Soco Mortal", "Hamboning", "Tapa Supremo", "Tamborilada Cósmica"],
        answer: 1,
        fact: "Hamboning vai salvar a sua vida algum dia!"
    },
    {
        category: "apenas_um_show",
        question: "O que o Saltitão faz para manter sua imortalidade?",
        options: ["Come sanduíches mágicos", "Dorme 100 anos", "Dança cerimonial todo ano", "Toma banho em leite cósmico"],
        answer: 2,
        fact: "Saltitão precisa realizar a dança espiritual para os Guardiões da Juventude Eterna todo ano."
    },
    {
        category: "apenas_um_show",
        question: "Qual é o doce favorito e assinatura do Pairulito?",
        options: ["Algodão-doce", "Pirulito", "Chocolate amargo", "Bala de goma"],
        answer: 1,
        fact: "Pairulito paga coisas comuns com pirulitos achando que são dinheiro!"
    },
    {
        category: "apenas_um_show",
        question: "Quem é a noiva/namorada do Musculoso?",
        options: ["Eileen", "Margarida", "Starla", "CJ"],
        answer: 2,
        fact: "Starla e Musculoso têm um romance dramático e muito barulhento!"
    },
    {
        category: "apenas_um_show",
        question: "Qual videogame fictício lendário Mordecai e Rigby tentam zerar?",
        options: ["Destruição do Reino", "Ossos Quebrados 4", "Não Olhe Para o Sol", "O Melhor Jogo de Todos"],
        answer: 0,
        fact: "Eles enfrentaram até a cabeça flutuante gigante de videogame!"
    },
    {
        category: "apenas_um_show",
        question: "Qual famosa frase o Musculoso diz sobre piadas da mãe?",
        options: ["'Minha mãe falou isso!'", "'Sabe quem mais faz isso? A MINHA MÃE!'", "'Minha mãe não deixa!'", "'Pergunte pra minha mãe!'"],
        answer: 1,
        fact: "O Fantasmão sempre comemora com um 'toca aqui' flutuante!"
    },
    {
        category: "apenas_um_show",
        question: "Qual é o nome do sanduíche lendário que se você não comer direito, morre?",
        options: ["Sanduíche da Morte", "Hambúrguer Supremo", "Submarino Tóxico", "Mega Bauru"],
        answer: 0,
        fact: "Você deve comer com o corte de cabelo certo e usando camisa corta-vento, senão vira pó!"
    },
    {
        category: "apenas_um_show",
        question: "Qual café os dois protagonistas costumam frequentar para ver a Margarida?",
        options: ["Central Perk", "Cafeteria da Cidade", "Café do Parque", "Mocha Express"],
        answer: 1,
        fact: "Mordecai passou temporadas inteiras tentando criar coragem para chamar a Margarida pra sair."
    },
    {
        category: "apenas_um_show",
        question: "O que Benson sempre ameaça fazer se eles não limparem o parque?",
        options: ["'Vou chamar a polícia!'", "'Vou cortar o salário!'", "'VOCÊS ESTÃO DEMITIDOS!'", "'Vou trancar a casa!'"],
        answer: 2,
        fact: "'OU VOCÊS LIMPAM ESSA BAGUNÇA AGORA MESMO OU ESTÃO DEMITIDOS!'"
    },
    {
        category: "apenas_um_show",
        question: "Qual é o poder lendário ensinado pelo mestre do karatê de corte de cabelo?",
        options: ["Golpe do Furacão", "Soco Mortal (Death Punch)", "Chute de Fogo", "Laser pelos Olhos"],
        answer: 1,
        fact: "O Karatê Mortal ensina que você pode destruir tudo usando calça jeans justa e corte mullet!"
    },

    // --- CONHECIMENTOS GERAIS ---
    {
        category: "conhecimentos_gerais",
        question: "Qual é a capital oficial do Brasil?",
        options: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
        answer: 2,
        fact: "Brasília foi inaugurada em 1960 durante o governo de Juscelino Kubitschek."
    },
    {
        category: "conhecimentos_gerais",
        question: "Qual é o maior oceano do planeta Terra em área?",
        options: ["Oceano Atlântico", "Oceano Índico", "Oceano Glacial Ártico", "Oceano Pacífico"],
        answer: 3,
        fact: "O Oceano Pacífico cobre mais de 30% da superfície terrestre!"
    },
    {
        category: "conhecimentos_gerais",
        question: "Quantos segundos tem 1 hora completa?",
        options: ["360 segundos", "1.200 segundos", "3.600 segundos", "6.000 segundos"],
        answer: 2,
        fact: "60 segundos por minuto x 60 minutos por hora = 3.600 segundos."
    },
    {
        category: "conhecimentos_gerais",
        question: "Qual elemento químico é representado pela letra 'O' na tabela periódica?",
        options: ["Ouro", "Oxigênio", "Ósmio", "Ozônio"],
        answer: 1,
        fact: "Ouro é representado por Au (do latim Aurum)."
    },
    {
        category: "conhecimentos_gerais",
        question: "Quantos continentes existem no modelo geográfico mais tradicional?",
        options: ["4 continentes", "6 continentes", "8 continentes", "10 continentes"],
        answer: 1,
        fact: "América, Europa, Ásia, África, Oceania e Antártida."
    },
    {
        category: "conhecimentos_gerais",
        question: "Qual animal é conhecido por mudar de cor para se camuflar?",
        options: ["Camaleão", "Jacaré", "Pinguim", "Koala"],
        answer: 0,
        fact: "Os camaleões mudam de cor usando células especializadas chamadas cromatóforos."
    },
    {
        category: "conhecimentos_gerais",
        question: "Qual planeta do Sistema Solar é conhecido como o 'Planeta Vermelho'?",
        options: ["Vênus", "Marte", "Júpiter", "Saturno"],
        answer: 1,
        fact: "Marte tem cor avermelhada devido à grande presença de óxido de ferro (ferrugem) na superfície."
    },
    {
        category: "conhecimentos_gerais",
        question: "Qual é o mamífero mais rápido em terra firme?",
        options: ["Leão", "Guepardo (Chita)", "Gazela", "Cavalo Selvagem"],
        answer: 1,
        fact: "O guepardo pode ultrapassar os 100 km/h em arrancadas curtas!"
    },

    // --- CULTURA POP & GAMES ---
    {
        category: "games_e_pop",
        question: "Qual é o famoso encanador bigodudo mascote da Nintendo?",
        options: ["Sonic", "Crash", "Mario", "Link"],
        answer: 2,
        fact: "Mario apareceu primeiro em 1981 no clássico Donkey Kong como 'Jumpman'."
    },
    {
        category: "games_e_pop",
        question: "Em Pokémon, qual é a criatura elétrica inicial de Ash Ketchum?",
        options: ["Charmander", "Squirtle", "Pikachu", "Bulbasaur"],
        answer: 2,
        fact: "Pikachu é o número 25 da Pokédex nacional."
    },
    {
        category: "games_e_pop",
        question: "Em Street Fighter, qual é o golpe lendário disparado por Ryu e Ken?",
        options: ["Kamehameha", "Hadouken", "Rasengan", "Tiger Shot"],
        answer: 1,
        fact: "Hadouken literalmente significa 'Punho em Onda de Movimento'!"
    },
    {
        category: "games_e_pop",
        question: "Em Minecraft, qual bloco icônico explode ao se aproximar de você?",
        options: ["Enderman", "Creeper", "Zumbi", "Esqueleto"],
        answer: 1,
        fact: "O Creeper nasceu de um erro de modelagem ao tentar criar um porco!"
    },
    {
        category: "games_e_pop",
        question: "No desenho Dragon Ball Z, qual é a transformação dourada dos Saiyajins?",
        options: ["Ultra Instinto", "Super Saiyajin", "Modo Sábio", "Gear 5"],
        answer: 1,
        fact: "Goku se transformou em Super Saiyajin pela primeira vez no Planeta Namekusei."
    },
    {
        category: "games_e_pop",
        question: "Qual ouriço azul da SEGA é famoso por correr na velocidade do som?",
        options: ["Knuckles", "Tails", "Shadow", "Sonic"],
        answer: 3,
        fact: "Sonic foi criado no início dos anos 90 para rivalizar diretamente com o Mario."
    },
    {
        category: "games_e_pop",
        question: "Em que ano foi lançado o clássico jogo Pac-Man nos arcades?",
        options: ["1970", "1980", "1990", "2000"],
        answer: 1,
        fact: "Pac-Man foi lançado em maio de 1980 pela Namco no Japão."
    },

    // --- CIÊNCIA MALUCA & UNIVERSO ---
    {
        category: "ciencia_maluca",
        question: "Qual é a estrela mais próxima do nosso planeta Terra?",
        options: ["Proxima Centauri", "Sol", "Estrela Polar", "Sirius"],
        answer: 1,
        fact: "O Sol é uma estrela anã amarela localizada a cerca de 150 milhões de km da Terra!"
    },
    {
        category: "ciencia_maluca",
        question: "O que acontece se você entrar em um buraco negro além do horizonte de eventos?",
        options: ["Você vira sorvete", "Espaguetificação gravitacional", "Teleporte instantâneo para Marte", "Você congela para sempre"],
        answer: 1,
        fact: "A atração gravitacional estica objetos em formas longas e finas, processo chamado de espaguetificação!"
    },
    {
        category: "ciencia_maluca",
        question: "Qual partícula atômica possui carga elétrica negativa?",
        options: ["Próton", "Nêutron", "Elétron", "Pósitron"],
        answer: 2,
        fact: "Os elétrons orbitam o núcleo composto por prótons (positivos) e nêutrons (neutros)."
    },
    {
        category: "ciencia_maluca",
        question: "Qual é a velocidade aproximada da luz no vácuo?",
        options: ["300 km/h", "30.000 km/s", "300.000 km/s", "3.000.000 km/s"],
        answer: 2,
        fact: "A luz viaja a incríveis ~299.792 km por segundo no vácuo!"
    },
    {
        category: "ciencia_maluca",
        question: "A água ferve normalmente a qual temperatura ao nível do mar?",
        options: ["50°C", "80°C", "100°C", "120°C"],
        answer: 2,
        fact: "A 1 atmosfera de pressão, a água atinge o ponto de ebulição a exatos 100°C."
    },
    {
        category: "ciencia_maluca",
        question: "Qual gás compõe a maior parte da atmosfera da Terra?",
        options: ["Oxigênio", "Nitrogênio", "Gás Carbônico", "Hélio"],
        answer: 1,
        fact: "O nitrogênio compõe cerca de 78% do ar que respiramos, enquanto o oxigênio é ~21%."
    }
];

/**
 * Retorna uma lista de perguntas aleatórias da categoria escolhida
 */
export function getQuestionDeck(category = "todas") {
    let pool = QUESTIONS_DB;
    if (category && category !== "todas") {
        pool = QUESTIONS_DB.filter(q => q.category === category);
    }
    // Embaralha uma cópia do deck
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
