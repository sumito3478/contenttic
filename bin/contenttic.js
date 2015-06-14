#!/usr/bin/env node
require('contenttic').generate().catch(function(reason) { require('log4js').getLogger().error(reason.stack); });
