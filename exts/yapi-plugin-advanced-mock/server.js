const controller = require('./controller');
const advModel = require('./advMockModel.js');
const yapi = require('yapi.js');
const mongoose = require('mongoose');


module.exports = function(){
  yapi.connect.then(function () {
    let Col = mongoose.connection.db.collection('adv_mock')
    Col.createIndex({
        interface_id: 1        
    })
    Col.createIndex({
      project_id: 1
    })

    let caseCol = mongoose.connection.db.collection('adv_mock_case')
    caseCol.createIndex({
        interface_id: 1        
    })
    caseCol.createIndex({
      project_id: 1
    })
  })
  this.bindHook('add_router', function(addRouter){
    addRouter({
      controller: controller,
      method: 'get',
      path: 'advmock/get',
      action: 'getMock'
    })
    addRouter({
      controller: controller,
      method: 'post',
      path: 'advmock/save',
      action: 'upMock'
    })
    addRouter({
      /**
       * 保存期望
       */
      controller: controller,
      method: 'post',
      path: 'advmock/case/save',
      action: 'saveCase'
    })

    addRouter({
      /**
       * 保存期望
       */
      controller: controller,
      method: 'get',
      path: 'advmock/case/get',
      action: 'getCase'
    })

    addRouter({
      /**
       * 获取期望列表
       */
      controller: controller,
      method: 'get',
      path: 'advmock/case/list',
      action: 'list'
    })

    addRouter({
      /**
       * 获取期望列表
       */
      controller: controller,
      method: 'post',
      path: 'advmock/case/del',
      action: 'delCase'
    })
  })
  this.bindHook('interface_del', async function(id){
    let inst = yapi.getInst(advModel);
    await inst.delByInterfaceId(id);
  })
  this.bindHook('project_del', async function(id){
    let inst = yapi.getInst(advModel);
    await inst.delByProjectId(id);
  })
  /**
   * let context = {
      projectData: project,
      interfaceData: interfaceData,
      ctx: ctx,
      mockJson: res 
    } 
   */
  this.bindHook('mock_after', async function(context){
    let interfaceId = context.interfaceData._id;
    let inst = yapi.getInst(advModel);
    let data = await inst.get(interfaceId);
    if(!data || !data.enable || !data.mock_script){
      return context;
    }
    let script = data.mock_script;
    let sandbox = {
      header: context.ctx.header,
      query: context.ctx.query,
      body: context.ctx.request.body,
      mockJson: context.mockJson,
      params: Object.assign({}, context.ctx.query, context.ctx.request.body),
      resHeader: context.resHeader,
      httpCode: context.httpCode,
      delay: context.httpCode
    }
    sandbox.cookie = {};
    
    context.ctx.header.cookie && context.ctx.header.cookie.split(';').forEach(function( Cookie ) {
        var parts = Cookie.split('=');
        sandbox.cookie[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
    });
    sandbox = yapi.commons.sandbox(sandbox, script);
    sandbox.delay = isNaN(sandbox.delay) ? 0 : +sandbox.delay;
    let handleMock = new Promise(resolve=>{
      setTimeout(()=>{
        resolve(true)
      }, sandbox.delay)
    })
    await handleMock;
    context.mockJson = sandbox.mockJson;
    context.resHeader = sandbox.resHeader;
    context.httpCode = sandbox.httpCode;
    context.delay = sandbox.delay;
  })
}