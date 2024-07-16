NPM = npm --prefix ./client
POETRY = cd server; poetry

dev:
	$(NPM) run watch & ($(POETRY) run server)

build:
	$(NPM) run build

serve:
	$(POETRY) run server
	
install:
	$(NPM) install
	$(POETRY) install
