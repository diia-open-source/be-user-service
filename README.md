# Diia

This repository provides an overview over the flagship product [**Diia**](https://diia.gov.ua/) developed by the [**Ministry of Digital Transformation of Ukraine**](https://thedigital.gov.ua/).

**Diia** is an app with access to citizen’s digital documents and government services.

The application was created so that Ukrainians could interact with the state in a few clicks, without spending their time on queues and paperwork - **Diia** open source application will help countries, companies and communities build a foundation for long-term relationships. At the heart of these relations are openness, efficiency and humanity.

We're pleased to share the **Diia** project with you.

## Useful Links

| Topic                                         | Link                       | Description                                                                |
| --------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| Ministry of Digital Transformation of Ukraine | https://thedigital.gov.ua/ | The Official homepage of the Ministry of Digital Transformation of Ukraine |
| Diia App                                      | https://diia.gov.ua/       | The Official website for the Diia application                              |

## Getting Started

This repository contains the service which provides capabilities for user settings management.

## Build Process

### **1. Clone codebase via `git clone` command**

Example:

```
git clone https://github.com/diia-open-source/be-user-service.git user-service
```

---

### **2. Go to code base root directory**

```
cd ./user-service
```

---

### **3. Install npm dependencies**

The installation of dependencies consists of the following 2 steps:

#### **1. Manually clone, build and link dependencies from `@diia-inhouse` scope**

Each Diia service depends on dependencies from `@diia-inhouse/<package>` scope which are distributed across different repositories, are built separately, and aren't published into public npm registry.

The full list of such dependencies can be found in the target service `package.json` file in `dependencies` and `devDependencies` sections respectively.

Detailed instructions on how to link dependencies from `@diia-inhouse/<package>` scope can be found in [LINKDEPS.md](https://github.com/diia-open-source/diia-setup-howto/tree/main/backend/LINKDEPS.md)

#### **2. Install public npm dependencies and use those linked from `@diia-inhouse` scope**

In order to install and use the linked dependencies for `user-service` the following command can be used:

```
$ cd ./user-service
$ npm link @diia-inhouse/db @diia-inhouse/redis ... @diia-inhouse/<package-name>
```

In case all dependencies from `@diia-inhouse` scope are linked, and can be resolved, you will then have a complete list of dependencies installed for the service code base.

---

### **4. Build service**

In order to build the service you have to run the command `npm run build` inside the root directory of service code base as per:

```
$ cd ./user-service
$ npm run build
```

---

### **5. Run the service locally**

In order to run the service locally you need to setup a Docker ecosystem (which runs required services such as Redis, MongoDB etc.), then create a suitable environment file `.env`, run database migrations (if required) and finally run the service itself in desired mode.

The following walks through these stages step by step...

#### **1. Run docker ecosystem**

See how to [run ecosystem](https://github.com/diia-open-source/diia-setup-howto/tree/main/backend/README.md).

#### **2. Create .env file**

In order to create a proper `.env` file to populate the node process environment you can copy it from `.env.example` such as:

```
$ cd ./user-service
$ cp .env.example .env
```

#### **3. Run database migrations**

In some services there is requirement to create MongoDB schemas before running these in order to make them functional. If the service has `migrate` script inside `package.json` then it definitely must be executed.

```
$ npm run migrate up
```

#### **4. Run the service**

Main execution file is located `./dist/index.js`

```
$ node ./dist/index.js
```

## How to contribute

The Diia project welcomes contributions into this solution; please refer to the CONTRIBUTING.md file for details

## Licensing

Copyright (C) Diia and all other contributors.

Licensed under the **EUPL** (the "License"); you may not use this file except in compliance with the License. Re-use is permitted, although not encouraged, under the EUPL, with the exception of source files that contain a different license.

You may obtain a copy of the License at [https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12).

Questions regarding the Diia project, the License and any re-use should be directed to [modt.opensource@thedigital.gov.ua](mailto:modt.opensource@thedigital.gov.ua).

This project incorporates third party material. In all cases the original copyright notices and the license under which these third party dependencies were provided remains as so. In relation to the Typescript dependency you should also review the [Typescript Third Party Notices](
https://github.com/microsoft/TypeScript/blob/9684ba6b0d73c37546ada901e5d0a5324de7fc1d/ThirdPartyNoticeText.txt).
