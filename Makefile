.PHONY: build-ApiFunction build-VendorApiFunction build-ReviewEmailsCronFunction build-SesEmailCronFunction build-BounceSyncFunction api-deps api-bundle

api-deps:
	npm ci
	npm run build -w @blossompot/shared

api-bundle: api-deps
	npx esbuild apps/api/src/index.ts \
		--bundle \
		--platform=node \
		--target=es2022 \
		--minify \
		--outfile=$(ARTIFACTS_DIR)/index.js \
		--external:@aws-sdk/client-dynamodb \
		--external:@aws-sdk/lib-dynamodb \
		--external:@aws-sdk/client-s3 \
		--external:@aws-sdk/s3-request-presigner
	npx esbuild apps/api/src/vendor-api.ts \
		--bundle \
		--platform=node \
		--target=es2022 \
		--minify \
		--outfile=$(ARTIFACTS_DIR)/vendor-api.js \
		--external:@aws-sdk/client-dynamodb \
		--external:@aws-sdk/lib-dynamodb \
		--external:@aws-sdk/client-s3 \
		--external:@aws-sdk/s3-request-presigner
	npx esbuild apps/api/src/scheduled.ts \
		--bundle \
		--platform=node \
		--target=es2022 \
		--minify \
		--outfile=$(ARTIFACTS_DIR)/scheduled.js \
		--external:@aws-sdk/client-dynamodb \
		--external:@aws-sdk/lib-dynamodb \
		--external:@aws-sdk/client-s3 \
		--external:@aws-sdk/s3-request-presigner
	npx esbuild apps/api/src/ses-scheduled.ts \
		--bundle \
		--platform=node \
		--target=es2022 \
		--minify \
		--outfile=$(ARTIFACTS_DIR)/ses-scheduled.js \
		--external:@aws-sdk/client-dynamodb \
		--external:@aws-sdk/lib-dynamodb \
		--external:@aws-sdk/client-s3 \
		--external:@aws-sdk/s3-request-presigner
	npx esbuild apps/api/src/bounce-sync.ts \
		--bundle \
		--platform=node \
		--target=es2022 \
		--minify \
		--outfile=$(ARTIFACTS_DIR)/bounce-sync.js \
		--external:@aws-sdk/client-dynamodb \
		--external:@aws-sdk/lib-dynamodb \
		--external:@aws-sdk/client-s3 \
		--external:@aws-sdk/s3-request-presigner

build-ApiFunction: api-bundle

build-VendorApiFunction: api-bundle

build-ReviewEmailsCronFunction: api-bundle

build-SesEmailCronFunction: api-bundle

build-BounceSyncFunction: api-bundle
