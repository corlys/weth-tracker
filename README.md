# WETH Tracker 

```
formula = depositted - withdrawal = totalSupply
```


## Quickstart

```bash
# 1. Install dependencies
npm ci

# 2. Compile typescript files
make build

# 3. Start target Postgres database and detach
make up

# 4. Start the processor
make process

# 5. The command above will block the terminal
#    being busy with fetching the chain data, 
#    transforming and storing it in the target database.
#
#    To start the graphql server open the separate terminal
#    and run. The GraphQL playground will be available at localhost:4350graphl
make serve
```