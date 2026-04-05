"""
Seed script for SEO local pages.
7 pages: 1 national + 1 department (Essonne) + 5 cities
All content is unique per page.
"""
import uuid

NATIONAL_PAGE = {
    "id": str(uuid.uuid4()),
    "slug": "rachat-voiture",
    "type": "national",
    "city_name": "",
    "department_slug": "",
    "department_name": "",
    "department_code": "",
    "seo_title": "Rachat voiture en France - Estimation gratuite et reprise rapide | Vente Flash Auto",
    "meta_description": "Vente Flash Auto rachete votre voiture partout en France. Estimation gratuite en 2 minutes, reprise simple et paiement rapide. Obtenez votre offre maintenant.",
    "h1": "Rachat de voiture en France - Estimation gratuite et reprise rapide",
    "intro": "Vente Flash Auto est le service de rachat de vehicules pour particuliers le plus rapide de France. Que vous soyez en region parisienne, dans le sud ou ailleurs, nous estimons et rachetons votre voiture en quelques etapes simples. Notre reseau de garages partenaires couvre tout le territoire pour vous offrir un service de proximite, rapide et transparent.",
    "sections": [
        {
            "title": "Comment fonctionne le rachat de voiture avec Vente Flash Auto ?",
            "content": "Notre processus est concu pour etre simple et rapide. Etape 1 : entrez votre plaque d'immatriculation et obtenez une estimation gratuite en moins de 2 minutes. Etape 2 : prenez rendez-vous dans le garage partenaire le plus proche de chez vous. Etape 3 : finalisez la vente sur place et recevez votre paiement rapidement. Pas de negociation, pas de mauvaises surprises."
        },
        {
            "title": "Combien vaut votre voiture ?",
            "content": "L'estimation de votre vehicule depend de plusieurs criteres : la marque, le modele, l'annee de mise en circulation, le kilometrage et l'etat general. Notre algorithme s'appuie sur les donnees du marche pour vous proposer un prix juste et competitif. L'estimation est 100% gratuite et sans engagement."
        },
        {
            "title": "Nous rachetons tous types de vehicules",
            "content": "Vehicules d'occasion en bon etat, voitures avec fort kilometrage, vehicules en panne ou accidentes, voitures sans controle technique valide... Nous etudions toutes les demandes. Chaque vehicule fait l'objet d'une evaluation personnalisee par nos experts."
        },
        {
            "title": "Pourquoi choisir Vente Flash Auto ?",
            "content": "Estimation gratuite en 2 minutes. Sans engagement, vous etes libre d'accepter ou non. Paiement rapide apres expertise. Accompagnement personnalise du debut a la fin. Reseau de garages partenaires partout en France. Plus de 500 vehicules deja rachetes."
        }
    ],
    "faq": [
        {"question": "L'estimation en ligne est-elle fiable ?", "answer": "Oui, notre estimation s'appuie sur les donnees du marche automobile en temps reel. Le prix final peut varier legerement apres expertise physique dans nos centres."},
        {"question": "Quels documents faut-il pour vendre sa voiture ?", "answer": "Vous aurez besoin de la carte grise, d'une piece d'identite et du certificat de non-gage. Nous vous guidons pour chaque etape."},
        {"question": "Combien de temps prend la vente ?", "answer": "L'estimation prend 2 minutes en ligne. La finalisation en centre prend environ 30 minutes. Le paiement est effectue sous 24 a 48h."},
        {"question": "Rachetez-vous les voitures en panne ?", "answer": "Oui, nous rachetons les vehicules en panne, accidentes ou sans controle technique. L'estimation sera adaptee a l'etat du vehicule."},
        {"question": "Le service est-il vraiment gratuit ?", "answer": "Oui, l'estimation et l'expertise sont 100% gratuites. Aucun frais de dossier, aucune commission. Vous ne payez rien."}
    ],
    "departments_list": [
        {"slug": "essonne", "name": "Essonne (91)"}
    ],
    "nearby_cities": [],
    "cta_text": "Estimez votre voiture gratuitement",
    "trust_block": True,
    "vehicles_block": True,
    "active": True,
    "noindex": False,
    "canonical_override": "",
}

ESSONNE_PAGE = {
    "id": str(uuid.uuid4()),
    "slug": "essonne",
    "type": "department",
    "city_name": "",
    "department_slug": "essonne",
    "department_name": "Essonne",
    "department_code": "91",
    "seo_title": "Rachat voiture dans l'Essonne (91) - Estimation gratuite | Vente Flash Auto",
    "meta_description": "Vendez votre voiture dans l'Essonne rapidement avec Vente Flash Auto. Estimation gratuite en ligne, reprise sans engagement et paiement rapide. Service disponible a Bretigny, Sainte-Genevieve-des-Bois, Saint-Michel-sur-Orge et plus.",
    "h1": "Rachat voiture dans l'Essonne - Estimation gratuite et reprise rapide",
    "intro": "Vous habitez dans l'Essonne et vous souhaitez vendre votre voiture rapidement ? Vente Flash Auto vous propose un service de rachat de vehicules simple, rapide et transparent sur tout le departement du 91. De Bretigny-sur-Orge a Sainte-Genevieve-des-Bois, en passant par Saint-Michel-sur-Orge et Epinay-sur-Orge, notre reseau de garages partenaires vous accueille pour une expertise et un rachat sans tracas.",
    "sections": [
        {
            "title": "Comment vendre sa voiture dans l'Essonne ?",
            "content": "Le rachat de votre vehicule dans le 91 se fait en 3 etapes. D'abord, estimez votre voiture en ligne en entrant simplement votre plaque d'immatriculation. Ensuite, choisissez un garage partenaire pres de chez vous dans l'Essonne et prenez rendez-vous. Enfin, presentez votre vehicule, validez l'offre et recevez votre paiement sous 24 a 48h. C'est aussi simple que ca."
        },
        {
            "title": "Combien vaut votre voiture dans l'Essonne ?",
            "content": "Le prix de rachat de votre vehicule depend du modele, de l'annee, du kilometrage et de l'etat general. Dans l'Essonne, les vehicules les plus demandes sont les citadines et les SUV compacts. Notre estimation en ligne est gratuite et vous donne un prix indicatif en moins de 2 minutes, base sur les cours actuels du marche automobile."
        },
        {
            "title": "Nous rachetons tous les vehicules dans l'Essonne",
            "content": "Que votre voiture soit en parfait etat, qu'elle ait un fort kilometrage, qu'elle soit en panne ou meme accidentee, nous etudions votre demande. Nous rachetons egalement les vehicules sans controle technique valide. Chaque situation est evaluee individuellement par nos experts dans le 91."
        },
        {
            "title": "Pourquoi choisir Vente Flash Auto dans l'Essonne ?",
            "content": "Un service de proximite avec des centres partenaires a Bretigny-sur-Orge, Saint-Michel-sur-Orge et dans les villes environnantes. Une estimation gratuite en 2 minutes. Aucun engagement : vous etes libre de refuser notre offre. Un paiement rapide et securise. Un accompagnement du debut a la fin par des conseillers specialises."
        },
        {
            "title": "Nos solutions de reprise auto dans l'Essonne",
            "content": "Notre reseau couvre l'ensemble du departement de l'Essonne. Que vous soyez a Bretigny-sur-Orge, Sainte-Genevieve-des-Bois, Saint-Michel-sur-Orge, Epinay-sur-Orge ou Le Plessis-Pate, un garage partenaire vous accueille a proximite. Decouvrez nos pages locales pour plus d'informations sur le rachat de vehicules pres de chez vous."
        }
    ],
    "faq": [
        {"question": "Ou puis-je vendre ma voiture dans l'Essonne ?", "answer": "Nous disposons de garages partenaires dans plusieurs villes de l'Essonne, notamment a Bretigny-sur-Orge, Saint-Michel-sur-Orge, Sainte-Genevieve-des-Bois, Epinay-sur-Orge et Le Plessis-Pate. Choisissez le centre le plus proche lors de votre estimation."},
        {"question": "Combien de temps pour vendre ma voiture dans le 91 ?", "answer": "L'estimation en ligne prend 2 minutes. Le rendez-vous en centre dure environ 30 minutes. Le paiement est effectue sous 24 a 48h apres accord."},
        {"question": "L'estimation est-elle gratuite dans l'Essonne ?", "answer": "Oui, l'estimation en ligne et l'expertise en centre sont 100% gratuites et sans engagement."},
        {"question": "Rachetez-vous les voitures en panne dans le 91 ?", "answer": "Oui, nous rachetons les vehicules en panne, accidentes ou sans controle technique dans tout le departement de l'Essonne."},
        {"question": "Comment se passe le paiement ?", "answer": "Apres accord sur le prix en centre, le paiement est effectue par virement bancaire sous 24 a 48h. Securise et sans surprise."}
    ],
    "cities_list": [
        {"slug": "bretigny-sur-orge", "name": "Bretigny-sur-Orge"},
        {"slug": "saint-michel-sur-orge", "name": "Saint-Michel-sur-Orge"},
        {"slug": "sainte-genevieve-des-bois", "name": "Sainte-Genevieve-des-Bois"},
        {"slug": "epinay-sur-orge", "name": "Epinay-sur-Orge"},
        {"slug": "le-plessis-pate", "name": "Le Plessis-Pate"},
    ],
    "nearby_cities": [],
    "cta_text": "Estimez votre voiture dans l'Essonne",
    "trust_block": True,
    "vehicles_block": True,
    "active": True,
    "noindex": False,
    "canonical_override": "",
}

CITY_PAGES = [
    {
        "id": str(uuid.uuid4()),
        "slug": "bretigny-sur-orge",
        "type": "city",
        "city_name": "Bretigny-sur-Orge",
        "department_slug": "essonne",
        "department_name": "Essonne",
        "department_code": "91",
        "seo_title": "Rachat voiture a Bretigny-sur-Orge - Estimation gratuite en 2 min | Vente Flash Auto",
        "meta_description": "Vente Flash Auto rachete votre voiture a Bretigny-sur-Orge rapidement. Estimation gratuite, reprise simple et paiement rapide. Obtenez votre offre en quelques minutes.",
        "h1": "Rachat voiture a Bretigny-sur-Orge - Estimation gratuite et reprise rapide",
        "intro": "Vous souhaitez vendre votre voiture a Bretigny-sur-Orge ? Vente Flash Auto vous propose une solution rapide et sans tracas. Situee au coeur de l'Essonne, Bretigny-sur-Orge beneficie d'un acces direct a nos garages partenaires. En quelques clics, obtenez une estimation gratuite de votre vehicule et planifiez un rendez-vous pour finaliser la vente. Pas de negociation interminable, pas d'annonces a gerer : nous nous occupons de tout.",
        "sections": [
            {"title": "Comment vendre sa voiture rapidement a Bretigny-sur-Orge ?", "content": "La vente de votre vehicule a Bretigny-sur-Orge se fait en 3 etapes simples. Commencez par entrer votre plaque d'immatriculation sur notre site pour obtenir une estimation instantanee. Ensuite, choisissez un creneau qui vous convient dans notre garage partenaire le plus proche. Enfin, presentez votre vehicule, validez le prix et repartez avec votre paiement. Le tout peut etre fait en moins de 48 heures."},
            {"title": "Combien vaut votre voiture a Bretigny-sur-Orge ?", "content": "La valeur de votre vehicule depend de sa marque, son modele, son annee, son kilometrage et son etat. A Bretigny-sur-Orge, les vehicules les plus couramment rachetes sont les citadines type Renault Clio ou Peugeot 208, mais nous evaluons tous les types de vehicules. Notre estimation en ligne est gratuite, sans engagement, et basee sur les prix reels du marche."},
            {"title": "Nous rachetons aussi les vehicules particuliers a Bretigny-sur-Orge", "content": "Voiture d'occasion classique, vehicule avec fort kilometrage, voiture en panne mecanique ou electrique, vehicule accidente sous conditions, voiture sans controle technique valide... A Bretigny-sur-Orge, nous etudions chaque demande. Meme si votre voiture ne roule plus, contactez-nous pour une estimation adaptee a votre situation."},
            {"title": "Pourquoi choisir Vente Flash Auto a Bretigny-sur-Orge ?", "content": "Estimation rapide en 2 minutes depuis chez vous. Service 100% gratuit et sans engagement. Paiement sous 24 a 48h apres expertise. Accompagnement personnalise par nos conseillers. Garage partenaire accessible facilement depuis Bretigny-sur-Orge. Expertise locale et connaissance du marche automobile de l'Essonne."},
            {"title": "Nos solutions de reprise auto a Bretigny-sur-Orge et en Essonne", "content": "Bretigny-sur-Orge est situee au coeur de l'Essonne, a proximite de Saint-Michel-sur-Orge, Sainte-Genevieve-des-Bois et Le Plessis-Pate. Notre reseau de garages partenaires couvre l'ensemble du departement. Decouvrez egalement nos services de rachat dans les villes voisines pour trouver le centre le plus proche de chez vous."}
        ],
        "faq": [
            {"question": "Est-ce que je peux vendre ma voiture sans controle technique a Bretigny-sur-Orge ?", "answer": "Oui, nous rachetons les vehicules sans CT valide. L'estimation sera adaptee en consequence, mais cela ne vous empeche pas de vendre."},
            {"question": "Combien de temps faut-il pour vendre sa voiture a Bretigny-sur-Orge ?", "answer": "L'estimation en ligne prend 2 minutes. Un rendez-vous peut etre pris sous 24h et le paiement est effectue sous 48h apres accord."},
            {"question": "L'estimation est-elle gratuite a Bretigny-sur-Orge ?", "answer": "Oui, 100% gratuite et sans engagement. Vous n'avez rien a payer, que vous acceptiez ou non l'offre."},
            {"question": "Est-ce que vous rachetez les vehicules en panne a Bretigny ?", "answer": "Oui, nous rachetons les vehicules en panne mecanique ou electrique. Un expert se deplacera si necessaire pour evaluer votre vehicule sur place."},
            {"question": "Comment se passe le paiement a Bretigny-sur-Orge ?", "answer": "Apres validation de l'offre en centre, le paiement est effectue par virement bancaire securise sous 24 a 48h."}
        ],
        "nearby_cities": [
            {"slug": "saint-michel-sur-orge", "name": "Saint-Michel-sur-Orge"},
            {"slug": "sainte-genevieve-des-bois", "name": "Sainte-Genevieve-des-Bois"},
            {"slug": "le-plessis-pate", "name": "Le Plessis-Pate"},
            {"slug": "epinay-sur-orge", "name": "Epinay-sur-Orge"}
        ],
        "cta_text": "Estimez votre voiture a Bretigny-sur-Orge",
        "trust_block": True, "vehicles_block": True, "active": True, "noindex": False, "canonical_override": "",
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "saint-michel-sur-orge",
        "type": "city",
        "city_name": "Saint-Michel-sur-Orge",
        "department_slug": "essonne",
        "department_name": "Essonne",
        "department_code": "91",
        "seo_title": "Rachat voiture a Saint-Michel-sur-Orge - Estimation gratuite | Vente Flash Auto",
        "meta_description": "Vendez votre voiture a Saint-Michel-sur-Orge avec Vente Flash Auto. Estimation en ligne gratuite, reprise sans engagement et paiement rapide. Obtenez votre prix en 2 minutes.",
        "h1": "Rachat voiture a Saint-Michel-sur-Orge - Estimation gratuite et reprise rapide",
        "intro": "Habitants de Saint-Michel-sur-Orge, vendez votre voiture simplement et rapidement grace a Vente Flash Auto. Notre service de rachat automobile vous permet d'obtenir une estimation gratuite en ligne, puis de finaliser la vente dans un centre partenaire proche de chez vous. Fini les petites annonces sans reponse et les negociations sans fin : obtenez un prix juste en quelques minutes.",
        "sections": [
            {"title": "Comment vendre sa voiture rapidement a Saint-Michel-sur-Orge ?", "content": "Vendre votre vehicule a Saint-Michel-sur-Orge n'a jamais ete aussi simple. Premiere etape : saisissez votre immatriculation et decouvrez instantanement la valeur de votre voiture. Deuxieme etape : reservez un rendez-vous dans le centre le plus proche. Troisieme etape : presentez votre vehicule, acceptez l'offre et recevez votre paiement. Tout est fait pour que la transaction soit fluide et rapide."},
            {"title": "Combien vaut votre voiture a Saint-Michel-sur-Orge ?", "content": "Le prix de rachat varie selon le modele, l'annee de mise en circulation, le kilometrage et l'etat du vehicule. A Saint-Michel-sur-Orge, nous observons une forte demande pour les berlines familiales et les SUV. Que vous possediez une citadine ou un monospace, notre algorithme calcule un prix competitif base sur les tendances actuelles du marche."},
            {"title": "Nous rachetons aussi les vehicules particuliers a Saint-Michel-sur-Orge", "content": "Voiture d'occasion en bon etat ou avec quelques kilometres au compteur, vehicule immobilise suite a une panne, voiture accidentee, vehicule sans CT a jour... Nous evaluons chaque cas a Saint-Michel-sur-Orge. Notre objectif est de vous proposer une solution de reprise adaptee, quelle que soit la situation de votre vehicule."},
            {"title": "Pourquoi choisir Vente Flash Auto a Saint-Michel-sur-Orge ?", "content": "Un service de proximite accessible depuis Saint-Michel-sur-Orge et ses environs. Une estimation fiable en 2 minutes. Aucune obligation d'accepter notre offre. Un processus transparent du debut a la fin. Paiement securise sous 48h. Des conseillers disponibles pour repondre a toutes vos questions."},
            {"title": "Nos solutions de reprise auto a Saint-Michel-sur-Orge et alentours", "content": "Saint-Michel-sur-Orge est idealement situee entre Bretigny-sur-Orge et Epinay-sur-Orge. Notre couverture dans l'Essonne vous permet de choisir le garage partenaire le plus pratique. Consultez egalement nos pages dediees aux villes voisines pour plus d'informations sur nos services locaux."}
        ],
        "faq": [
            {"question": "Peut-on vendre sa voiture sans CT a Saint-Michel-sur-Orge ?", "answer": "Oui, le controle technique n'est pas obligatoire pour nous vendre votre vehicule. Nous adaptons notre estimation en fonction de l'etat du vehicule."},
            {"question": "Combien de temps pour vendre sa voiture a Saint-Michel-sur-Orge ?", "answer": "Comptez 2 minutes pour l'estimation en ligne, puis 24 a 48h pour finaliser la vente en centre. Le paiement suit sous 48h."},
            {"question": "L'estimation est-elle vraiment gratuite ?", "answer": "Absolument. L'estimation en ligne et l'expertise en centre sont gratuites. Vous ne payez rien, que vous acceptiez ou non notre offre."},
            {"question": "Rachetez-vous les voitures en panne a Saint-Michel ?", "answer": "Oui, nous evaluons et rachetons les vehicules en panne, qu'il s'agisse d'une panne mecanique, electrique ou autre."},
            {"question": "Quel est le mode de paiement ?", "answer": "Nous procedons par virement bancaire securise. Le paiement est effectue sous 24 a 48h apres la finalisation de la vente."}
        ],
        "nearby_cities": [
            {"slug": "bretigny-sur-orge", "name": "Bretigny-sur-Orge"},
            {"slug": "epinay-sur-orge", "name": "Epinay-sur-Orge"},
            {"slug": "sainte-genevieve-des-bois", "name": "Sainte-Genevieve-des-Bois"}
        ],
        "cta_text": "Estimez votre voiture a Saint-Michel-sur-Orge",
        "trust_block": True, "vehicles_block": True, "active": True, "noindex": False, "canonical_override": "",
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "sainte-genevieve-des-bois",
        "type": "city",
        "city_name": "Sainte-Genevieve-des-Bois",
        "department_slug": "essonne",
        "department_name": "Essonne",
        "department_code": "91",
        "seo_title": "Rachat voiture a Sainte-Genevieve-des-Bois - Estimation gratuite | Vente Flash Auto",
        "meta_description": "Vente Flash Auto rachete votre voiture a Sainte-Genevieve-des-Bois. Estimation gratuite en ligne, reprise rapide et paiement securise. Vendez votre vehicule en toute simplicite.",
        "h1": "Rachat voiture a Sainte-Genevieve-des-Bois - Estimation gratuite et reprise rapide",
        "intro": "Sainte-Genevieve-des-Bois, ville dynamique de l'Essonne, est desormais couverte par le service de rachat automobile Vente Flash Auto. Si vous cherchez a vendre votre voiture sans perdre de temps, notre plateforme vous permet d'obtenir une estimation precise en quelques clics. Nos garages partenaires dans le secteur vous accueillent pour finaliser la transaction en toute confiance.",
        "sections": [
            {"title": "Comment vendre sa voiture rapidement a Sainte-Genevieve-des-Bois ?", "content": "Le processus est pense pour les habitants de Sainte-Genevieve-des-Bois qui veulent aller a l'essentiel. Entrez votre immatriculation, recevez une estimation basee sur le marche, puis rendez-vous dans un de nos centres proches. L'expertise est rapide et le paiement intervient dans les 48 heures suivant l'accord. Vous n'avez aucune demarche administrative complexe a effectuer."},
            {"title": "Combien vaut votre voiture a Sainte-Genevieve-des-Bois ?", "content": "Chaque vehicule est unique. A Sainte-Genevieve-des-Bois, les proprietaires nous confient souvent des vehicules familiaux type Scenic, C4 Picasso ou Tiguan. Mais nous evaluons tous les types de voitures. Notre estimation prend en compte le marche local et les tendances nationales pour vous offrir un prix juste et transparent."},
            {"title": "Nous rachetons aussi les vehicules particuliers a Sainte-Genevieve-des-Bois", "content": "Vehicule d'occasion avec kilometrage eleve, voiture en panne depuis plusieurs mois, vehicule accidente stationne dans votre garage, auto sans CT valide... A Sainte-Genevieve-des-Bois, nous trouvons une solution pour chaque situation. N'hesitez pas a demander une estimation meme si vous pensez que votre voiture n'a plus de valeur."},
            {"title": "Pourquoi choisir Vente Flash Auto a Sainte-Genevieve-des-Bois ?", "content": "Proximite : des centres accessibles facilement depuis Sainte-Genevieve-des-Bois. Rapidite : estimation en 2 minutes, vente finalisee en 48h. Transparence : pas de frais caches, pas de mauvaises surprises. Liberte : vous etes libre d'accepter ou de refuser notre offre. Expertise : plus de 500 vehicules rachetes par nos equipes."},
            {"title": "Nos solutions de reprise auto a Sainte-Genevieve-des-Bois et en Essonne", "content": "Depuis Sainte-Genevieve-des-Bois, vous avez acces a notre reseau dans tout l'Essonne. Les villes d'Epinay-sur-Orge, Bretigny-sur-Orge et Saint-Michel-sur-Orge sont a quelques minutes. Explorez nos pages dediees a ces villes pour decouvrir le centre le plus adapte a votre situation."}
        ],
        "faq": [
            {"question": "Peut-on vendre une voiture sans CT a Sainte-Genevieve-des-Bois ?", "answer": "Oui, nous acceptons les vehicules sans controle technique. Notre estimation tiendra compte de l'etat du vehicule."},
            {"question": "Quel delai pour vendre a Sainte-Genevieve-des-Bois ?", "answer": "L'estimation en ligne est instantanee. La vente peut etre finalisee en centre sous 24 a 48h."},
            {"question": "L'estimation est-elle gratuite et sans engagement ?", "answer": "Oui, totalement gratuite et sans aucun engagement de votre part. Vous restez libre a chaque etape."},
            {"question": "Rachetez-vous les vehicules en panne ?", "answer": "Oui, les vehicules en panne mecanique ou electrique sont acceptes. Nous pouvons organiser un deplacement si necessaire."},
            {"question": "Comment fonctionne le paiement ?", "answer": "Le paiement est realise par virement securise sous 24 a 48h apres accord en centre. Pas de cheque, pas d'especes."}
        ],
        "nearby_cities": [
            {"slug": "epinay-sur-orge", "name": "Epinay-sur-Orge"},
            {"slug": "bretigny-sur-orge", "name": "Bretigny-sur-Orge"},
            {"slug": "saint-michel-sur-orge", "name": "Saint-Michel-sur-Orge"}
        ],
        "cta_text": "Estimez votre voiture a Sainte-Genevieve-des-Bois",
        "trust_block": True, "vehicles_block": True, "active": True, "noindex": False, "canonical_override": "",
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "epinay-sur-orge",
        "type": "city",
        "city_name": "Epinay-sur-Orge",
        "department_slug": "essonne",
        "department_name": "Essonne",
        "department_code": "91",
        "seo_title": "Rachat voiture a Epinay-sur-Orge - Estimation gratuite en 2 min | Vente Flash Auto",
        "meta_description": "Vendez votre voiture a Epinay-sur-Orge rapidement avec Vente Flash Auto. Estimation en ligne gratuite, reprise sans engagement et paiement sous 48h.",
        "h1": "Rachat voiture a Epinay-sur-Orge - Estimation gratuite et reprise rapide",
        "intro": "Epinay-sur-Orge, charmante commune de l'Essonne situee entre Paris et Etampes, est couverte par le service Vente Flash Auto. Vous avez un vehicule a vendre ? Plus besoin de publier des annonces ou d'attendre des semaines. Notre service vous garantit une estimation gratuite en ligne, suivie d'une prise en charge rapide dans un centre partenaire a proximite.",
        "sections": [
            {"title": "Comment vendre sa voiture rapidement a Epinay-sur-Orge ?", "content": "Vendez votre voiture depuis Epinay-sur-Orge en toute simplicite. Il suffit de renseigner votre plaque d'immatriculation pour obtenir une offre de rachat. Prenez ensuite rendez-vous au creneau de votre choix. Le jour J, notre expert examine votre vehicule et vous confirme le prix. Si vous acceptez, le paiement est vire sous 48h. Simple, rapide, sans stress."},
            {"title": "Combien vaut votre voiture a Epinay-sur-Orge ?", "content": "A Epinay-sur-Orge, nous constatons une demande soutenue pour les vehicules compacts et les utilitaires legers. Mais quel que soit votre vehicule, notre estimation en ligne gratuite vous donne un premier prix fiable. L'evaluation tient compte de la cote Autobiz, du kilometrage, de l'annee et de l'etat de votre auto."},
            {"title": "Nous rachetons aussi les vehicules particuliers a Epinay-sur-Orge", "content": "Voiture d'occasion recente ou ancienne, vehicule diesel ou essence, voiture electrique ou hybride, vehicule avec plus de 200 000 km, voiture en panne stationnee depuis longtemps... A Epinay-sur-Orge, nous avons deja rachete des dizaines de vehicules dans des situations tres variees. Tentez l'estimation, vous pourriez etre surpris."},
            {"title": "Pourquoi choisir Vente Flash Auto a Epinay-sur-Orge ?", "content": "Un service local ancre dans l'Essonne. Des prix justes bases sur le marche reel. Une estimation gratuite et sans engagement. Un paiement rapide et securise. Un interlocuteur dedie pour vous accompagner. La possibilite de vendre meme sans controle technique a jour."},
            {"title": "Nos solutions de reprise auto a Epinay-sur-Orge et environs", "content": "Epinay-sur-Orge est voisine de Sainte-Genevieve-des-Bois et de Saint-Michel-sur-Orge. Notre couverture dans l'Essonne vous offre plusieurs options de centres partenaires. Retrouvez nos services dans les villes proches et choisissez le lieu le plus pratique pour vous."}
        ],
        "faq": [
            {"question": "Puis-je vendre ma voiture sans controle technique a Epinay-sur-Orge ?", "answer": "Oui, le CT n'est pas requis. Nous ajustons notre proposition en fonction de l'etat reel du vehicule."},
            {"question": "En combien de temps puis-je vendre a Epinay-sur-Orge ?", "answer": "Estimation instantanee en ligne, rendez-vous sous 24h et paiement sous 48h. Le processus complet peut prendre moins de 3 jours."},
            {"question": "L'estimation est-elle vraiment gratuite ?", "answer": "Oui, 100% gratuite. Pas de frais de dossier, pas de commission, pas de surprise."},
            {"question": "Achetez-vous les voitures en panne ?", "answer": "Oui, nous rachetons les vehicules en panne a Epinay-sur-Orge. Un expert peut se deplacer si le vehicule ne roule plus."},
            {"question": "Comment est effectue le paiement ?", "answer": "Par virement bancaire securise, dans les 24 a 48 heures suivant l'accord de vente."}
        ],
        "nearby_cities": [
            {"slug": "sainte-genevieve-des-bois", "name": "Sainte-Genevieve-des-Bois"},
            {"slug": "saint-michel-sur-orge", "name": "Saint-Michel-sur-Orge"},
            {"slug": "bretigny-sur-orge", "name": "Bretigny-sur-Orge"}
        ],
        "cta_text": "Estimez votre voiture a Epinay-sur-Orge",
        "trust_block": True, "vehicles_block": True, "active": True, "noindex": False, "canonical_override": "",
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "le-plessis-pate",
        "type": "city",
        "city_name": "Le Plessis-Pate",
        "department_slug": "essonne",
        "department_name": "Essonne",
        "department_code": "91",
        "seo_title": "Rachat voiture au Plessis-Pate - Estimation gratuite | Vente Flash Auto",
        "meta_description": "Vente Flash Auto rachete votre voiture au Plessis-Pate rapidement. Estimation gratuite en ligne, reprise sans engagement et paiement sous 48h. Service de proximite dans l'Essonne.",
        "h1": "Rachat voiture au Plessis-Pate - Estimation gratuite et reprise rapide",
        "intro": "Le Plessis-Pate, petite commune residentiielle de l'Essonne, beneficie desormais du service Vente Flash Auto. Vous avez une voiture a vendre et vous ne voulez pas perdre de temps avec les petites annonces ? Notre solution de rachat immediat est faite pour vous. En moins de 2 minutes, obtenez une estimation de votre vehicule et planifiez un rendez-vous dans un centre partenaire accessible depuis Le Plessis-Pate.",
        "sections": [
            {"title": "Comment vendre sa voiture rapidement au Plessis-Pate ?", "content": "Depuis Le Plessis-Pate, vendez votre voiture en 3 etapes claires. Estimez votre vehicule en ligne gratuitement. Prenez rendez-vous dans un centre partenaire proche, par exemple a Bretigny-sur-Orge situe a quelques minutes. Finalisez la vente lors de votre visite et recevez votre paiement par virement sous 48 heures."},
            {"title": "Combien vaut votre voiture au Plessis-Pate ?", "content": "Le prix de votre vehicule depend de multiples facteurs. Au Plessis-Pate, nous rachetons aussi bien des petites citadines que des vehicules de tourisme ou des utilitaires. Chaque evaluation est personnalisee et prend en compte les specificites de votre auto. L'estimation est gratuite, rapide et basee sur les donnees du marche automobile."},
            {"title": "Nous rachetons aussi les vehicules particuliers au Plessis-Pate", "content": "Voiture avec fort kilometrage, vehicule diesel ancien, voiture en panne depuis des mois dans votre allee, auto accidentee non reparee, vehicule sans CT... Au Plessis-Pate comme dans tout l'Essonne, nous etudions chaque situation individuellement. Aucun cas n'est exclu d'avance."},
            {"title": "Pourquoi choisir Vente Flash Auto au Plessis-Pate ?", "content": "Accessibilite : des centres partenaires proches du Plessis-Pate. Gratuite : estimation et expertise sans frais. Rapidite : vente finalisable en 48h. Securite : paiement par virement bancaire. Simplicite : un seul interlocuteur tout au long du processus. Confiance : plus de 500 vehicules deja rachetes dans la region."},
            {"title": "Nos solutions de reprise auto au Plessis-Pate et dans l'Essonne", "content": "Le Plessis-Pate est situe entre Bretigny-sur-Orge et les communes du nord de l'Essonne. Vous pouvez choisir le centre partenaire qui vous arrange le mieux. Decouvrez nos pages dediees aux villes voisines : Bretigny-sur-Orge, Sainte-Genevieve-des-Bois et d'autres communes du 91."}
        ],
        "faq": [
            {"question": "Peut-on vendre sa voiture sans CT au Plessis-Pate ?", "answer": "Oui, nous rachetons les vehicules sans controle technique valide. Le prix sera ajuste selon l'etat du vehicule."},
            {"question": "Combien de temps pour vendre au Plessis-Pate ?", "answer": "L'estimation prend 2 minutes. La vente peut etre conclue en centre sous 24 a 48h. Paiement par virement sous 48h."},
            {"question": "C'est vraiment gratuit et sans engagement ?", "answer": "Oui, a 100%. Vous pouvez obtenir une estimation et refuser l'offre sans aucune consequence."},
            {"question": "Rachetez-vous les vieilles voitures au Plessis-Pate ?", "answer": "Oui, l'age du vehicule n'est pas un critere d'exclusion. Nous evaluons tous les vehicules, y compris les anciens modeles."},
            {"question": "Comment se deroule le paiement ?", "answer": "Le paiement est effectue par virement bancaire securise dans les 24 a 48h suivant la finalisation en centre."}
        ],
        "nearby_cities": [
            {"slug": "bretigny-sur-orge", "name": "Bretigny-sur-Orge"},
            {"slug": "sainte-genevieve-des-bois", "name": "Sainte-Genevieve-des-Bois"},
            {"slug": "epinay-sur-orge", "name": "Epinay-sur-Orge"}
        ],
        "cta_text": "Estimez votre voiture au Plessis-Pate",
        "trust_block": True, "vehicles_block": True, "active": True, "noindex": False, "canonical_override": "",
    },
]

ALL_PAGES = [NATIONAL_PAGE, ESSONNE_PAGE] + CITY_PAGES
