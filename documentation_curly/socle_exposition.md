## Appeler le socle d'exposition

* Environnement de développement `d1`:
```
idp x-connect: d1-s4986-gtw.hpr.caas.ca-ts.group.gca
socle d'exposition: d1-s4746-alb02.cats-p1443-hprd.aws.ca-ts.gca
```

* Modèles à disposition:

    * **Claude Sonnet 4.5** 

        * Subscription id: `601e47e8-68e1-430d-a987-4d813236e998`
        * Prompt cost: 0.003$/1k tokens 
        * Completion cost: 0.015$/1k tokens


    * **Claude Haiku 4.5**
        * Subscription id: `045e4591-516d-46f8-9cea-6315948e0da9`
        * Prompt cost: 0.005$/1k tokens
        * Completion cost: 0.001$/1k tokens

**A noter:**

La réponse du endpoint de complétion contient les metadata d'usage et de coût de la requête.

```json
{
   ...
    "usage": {
        "completion_tokens": 34,
        "prompt_tokens": 38,
        "total_tokens": 72
    },
    "metrics": {
        ...
        "pricing": {
            "prompt_cost": 0.00019759999999999998,
            "completion_cost": 0.0005304,
            "total_cost": 0.0007279999999999999
        }
    }
}
```

### Authentification x-connect

L'appel au socle d'exposition requiert l'obtention préalable d'un token auprès du service x-connect.

L'authentification à x-connect se fait via `Basic authentication` avec les client id et client secret fournis, dans le header `Authorization`.     

```bash
curl -X POST https://d1-s4986-gtw.hpr.caas.ca-ts.group.gca/socle-llm/endpoint/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Authorization: Bearer <token>" \
  -d "grant_type=client_credentials&scope=openid"
```

### Appel du service de complétion

La spécification OpenAPI du service est disponible [ici](https://d1-s4746-alb02.cats-p1443-hprd.aws.ca-ts.gca/docs#/Completion/chat_completion_chat_completions_post).

**A noter:**

* Authentification via un bearer token x-connect valide dans le header `Authorization`
* Champ `model` du body attend le **subscription id** du modèle cible
* Les souscriptions sont soumise à des quotas pour la complétion. Par défaut:
    * 500 req/minute
    * 50 000 tokens/minute

Exemple de body pour la complétion:

```json
{
  "messages": [
    {
      "role": "system",
      "content": "Prompt système contenant les instructions pour le modèle"
    },  
    {
      "role": "user",
      "content": "Question de l'utilisateur ou tâche spécifique à traiter lors de cette requête"
    }
  ],
  "model": "subscription-id",
  "stream": false,
  "temperature": 1
}
```

Exemple complet:

```bash
curl -X POST https://d1-s4746-alb02.cats-p1443-hprd.aws.ca-ts.gca/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "messages": [
      {
        "role": "system",
        "content": "Prompt système contenant les instructions pour le modèle"
      },
      {
        "role": "user",
        "content": "Question de l\'utilisateur ou tâche spécifique à traiter lors de cette requête"
      }
    ],
    "model": "subscription-id",
    "stream": false,
    "temperature": 1
  }'
```
