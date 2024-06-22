NPM = npm --prefix ./client
POETRY = cd server; poetry

dev: build serve

build:
	$(NPM) run build

serve:
	$(POETRY) run server
	
install:
	$(NPM) install
	$(POETRY) install
