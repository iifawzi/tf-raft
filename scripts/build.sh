#!/bin/bash

./node_modules/.bin/grpc_tools_node_protoc --grpc_out=grpc_js:./  --js_out=import_style=commonjs,binary:./  adapters/network/grpc/protobuf/service.proto
protoc --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts  --ts_out=grpc_js:./  adapters/network/grpc/protobuf/service.proto               
