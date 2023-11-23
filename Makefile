LIBMARKDOWN := libmarkdown
STATIC := static

WASM_LIBS := $(LIBMARKDOWN)

TARGETS := $(patsubst %, $(STATIC)/modules/%, $(WASM_LIBS))

LIBMARKDOWN_SRC := $(wildcard $(LIBMARKDOWN)/src/*.rs)

.PHONY: all clean 

all: $(TARGETS)

$(STATIC)/modules/%: %/pkg
	rm -rf $@
	cp -r $< $@

$(LIBMARKDOWN)/pkg: $(LIBMARKDOWN_SRC) $(LIBMARKDOWN)/Cargo.toml
	(cd $(LIBMARKDOWN) && wasm-pack build --target web)

clean:
	rm -rf $(STATIC)/modules/*
	rm -rf $(LIBMARKDOWN)/pkg
	(cd $(LIBMARKDOWN) && cargo clean)