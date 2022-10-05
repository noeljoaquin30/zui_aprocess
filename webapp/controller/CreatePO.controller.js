sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast"
],

function (Controller, JSONModel, Common, MessageBox, History, MessageToast) {
    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
    var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyy-MM-dd" });
    
    return Controller.extend("zuiaprocess.controller.CreatePO", {

        onInit: function() {
            const route = this.getOwnerComponent().getRouter().getRoute("RouteCreatePO");
            route.attachPatternMatched(this.onPatternMatched, this);
            
            var me = this;
            // this._proc = "createpo";
            // this._fBackButton= sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction;

            sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = function(oEvent) {
                // console.log(oEvent)
                // console.log(me._proc)
                me.onNavBack();
            }
        },
        
        onPatternMatched: function() {
            this.getView().setModel(new JSONModel({
                today: dateFormat.format(new Date()),
                activeGroup: ""
            }), "ui");

            var me = this;
            this._oModel = this.getOwnerComponent().getModel();
            this._aColumns = [];
            this.getColumnProp();
            this._poCreated = false;
            
            // console.log(this.getOwnerComponent().getModel("UI"))
            var vSBU = this.getOwnerComponent().getModel("UI_MODEL").getData().sbu;

            if (this.getView().getModel("payterms") !== undefined) this.getView().getModel("payterms").destroy();
            if (this.getView().getModel("header") !== undefined) this.getView().getModel("header").destroy();
            if (this.getView().getModel("detail") !== undefined) this.getView().getModel("detail").destroy();
            if (this.getView().getModel("remarks") !== undefined) this.getView().getModel("remarks").destroy();
            if (this.getView().getModel("packins") !== undefined) this.getView().getModel("packins").destroy();
            if (this.getView().getModel("fabspecs") !== undefined) this.getView().getModel("fabspecs").destroy();
            // console.log(this.getOwnerComponent().getModel("CREATEPO_MODEL").getData().detail)
            var oJSONModelDtl = new JSONModel();
            var oDataDetail = this.getOwnerComponent().getModel("CREATEPO_MODEL").getData().detail.filter(fItem => fItem.GROUP === "1");
            oJSONModelDtl.setData(oDataDetail);
            this.getView().setModel(oJSONModelDtl, "detail");
            // console.log(oDataDetail)
            
            var oJSONModel = new JSONModel();
            var oHeaderData = this.getOwnerComponent().getModel("CREATEPO_MODEL").getData().header;
            var oDataRem = {}, oDataPackIns = {}, oDataFabSpecs = {};
            var aDataRemItems = [], aDataPackInsItems = [], aDataFabSpecsItems = [];
            var oJSONModelPT = new JSONModel();
            var iCounter = 0;
            var mData = {};

            oHeaderData.forEach(item => {
                item.PODATE = dateFormat.format(new Date());
                item.PAYTERMS = "";
                item.INCOTERMS = "";
                item.DESTINATION = "";
                item.CURR = "";
                item.EXRATE = "";
                item.SHIPMODE = "";

                var sVendor = item.VENDOR;

                if (!isNaN(sVendor)) {
                    while (sVendor.length < 10) sVendor = "0" + sVendor;
                }

                me._oModel.read("/ShipModeSet", {
                    urlParameters: {
                        "$filter": "SBU eq '" + vSBU + "'"
                    },
                    success: function (oDataSM, oResponse) {
                        // console.log(oDataSM)
                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(oDataSM.results);
                        me.getView().setModel(oJSONModel, "shipmode");

                        if (oDataSM.results.length === 1) {
                            item.SHIPMODE = oDataSM.results[0].SHIPMODE;
                        }

                        setTimeout(() => {
                            me._oModel.read("/PayTermsSet", {
                                urlParameters: {
                                    "$filter": "LIFNR eq '" + sVendor + "' and EKORG eq '" + item.PURCHORG + "'"
                                },
                                success: function (oData, oResponse) {
                                    iCounter++;                                
                                    mData[item.GROUP] = oData.results;
                                    // console.log(oData)
        
                                    if (oData.results.length > 0) {
                                        item.PAYTERMS = oData.results[0].ZTERM;
                                        item.INCOTERMS = oData.results[0].INCO1;
                                        item.DESTINATION = oData.results[0].INCO2;
                                        item.CURR = oData.results[0].WAERS;
                                    }
        
                                    if (iCounter === oHeaderData.length) {
                                        oJSONModelPT.setData(mData);
                                        me.getView().setModel(oJSONModelPT, "payterms");
        
                                        oJSONModel.setData(oHeaderData);
                                        me.getView().setModel(oJSONModel, "header");
                                    } 
                                },
                                error: function (err) {
                                    iCounter++;
                                }
                            });                        
                        }, 100);                         
                    },
                    error: function (err) { }
                });

                // if (me.getView().getModel("shipmode").getData().length === 1) {
                //     item.SHIPMODE = me.getView().getModel("shipmode").getData()[0].SHIPMODE;
                // }

                aDataRemItems.push({
                    GROUP: item.GROUP,
                    ITEM: "1",
                    REMARKS: "",
                    STATUS: ""                    
                });

                oDataRem[item.GROUP] = aDataRemItems;

                aDataPackInsItems.push({
                    GROUP: item.GROUP,
                    ITEM: "1",
                    PACKINS: "",
                    STATUS: ""                    
                });

                oDataPackIns[item.GROUP] = aDataPackInsItems;

                aDataFabSpecsItems.push({
                    GROUP: item.GROUP,
                    EBELN: "",
                    EBELP: "00010",
                    ZZMAKT: "",
                    ZZHAFE: "",
                    ZZSHNK: "",
                    ZZCHNG: "",
                    ZZSTAN: "",
                    ZZDRY: "",
                    ZZCFWA: "",
                    ZZCFCW: "",
                    ZZSHRQ: "",
                    ZZSHDA: "",
                    PLANMONTH: this.getView().getModel("detail").getData()[0].PLANMONTH,
                    ZZREQ1: "",
                    ZZREQ2: "",
                    STATUS: "NEW"                 
                });

                oDataFabSpecs[item.GROUP] = aDataFabSpecsItems;

                aDataRemItems = [], aDataPackInsItems = [], aDataFabSpecsItems = [];                
            })

            // oJSONModel.setData(oHeaderData);
            // this.getView().setModel(oJSONModel, "header");

            var oJSONModelRem = new JSONModel();
            var oJSONModelPackIns = new JSONModel();
            var oJSONModelFabSpecs = new JSONModel();

            oJSONModelRem.setData(oDataRem);
            this.getView().setModel(oJSONModelRem, "remarks");

            oJSONModelPackIns.setData(oDataPackIns);
            this.getView().setModel(oJSONModelPackIns, "packins");            

            oJSONModelFabSpecs.setData(oDataFabSpecs);
            this.getView().setModel(oJSONModelFabSpecs, "fabspecs");

            var oJSONModelDDText = new JSONModel();
            oJSONModelDDText.setData(this.getOwnerComponent().getModel("CAPTION_MSGS_MODEL").getData().text);
            this.getView().setModel(oJSONModelDDText, "ddtext");
            // console.log(this.getView().getModel("ddtext"))

            this._bFabSpecsChanged = false;
            this._bRemarksChanged = false;
            this._bPackInsChanged = false;
            this._bHeaderChanged = false;
            this._bDetailsChanged = false;
            this._aRemarksDataBeforeChange = [];
            this._aPackInsDataBeforeChange = [];
            this._aFabSpecsDataBeforeChange = [];
            this._aHeaderDataBeforeChange = [];
            this._aDetailsDataBeforeChange = [];
            this._validationErrors = [];
            this._aCreatePOResult = [];

            this.getOwnerComponent().getModel("UI_MODEL").setProperty("/flag", false);
        },

        onNavBack: function(oEvent) {
            var oData = {
                Process: "po-cancel",
                Text: this.getView().getModel("ddtext").getData()["CONF_CANCEL_CREATEPO"]
            }

            var oJSONModel = new JSONModel();
            oJSONModel.setData(oData);

            if (!this._ConfirmDialog) {
                this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                this._ConfirmDialog.setModel(oJSONModel);
                this.getView().addDependent(this._ConfirmDialog);
            }
            else this._ConfirmDialog.setModel(oJSONModel);
                
            this._ConfirmDialog.open();
        },

        getColumnProp: async function() {
            var sPath = jQuery.sap.getModulePath("zuiaprocess", "/model/columns.json");

            var oModelColumns = new JSONModel();
            await oModelColumns.loadData(sPath);

            this._aColumns = oModelColumns.getData();
        },

        onEditHdr: function(oEvent) {
            this.setRowEditMode("header");

            this.byId("btnEditHdr").setVisible(false);
            this.byId("btnUpdDate").setVisible(false);
            this.byId("btnFabSpecs").setVisible(false);
            this.byId("btnHdrTxt").setVisible(false);
            this.byId("btnGenPO").setVisible(false);
            this.byId("btnSaveHdr").setVisible(true);
            this.byId("btnCancelHdr").setVisible(true);

            this._aHeaderDataBeforeChange = jQuery.extend(true, [], this.getView().getModel("header").getData());
            // console.log(this._aHeaderDataBeforeChange)
        },

        onCancelHdr: function(oEvent) {
            if (this._bHeaderChanged) {
                var oData = {
                    Process: "header-cancel",
                    Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                }

                var oJSONModel = new JSONModel();
                oJSONModel.setData(oData);

                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(oJSONModel);
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(oJSONModel);
                    
                this._ConfirmDialog.open();
            }
            else {
                this.setRowReadMode("header");

                this.byId("btnEditHdr").setVisible(true);
                this.byId("btnUpdDate").setVisible(true);
                this.byId("btnFabSpecs").setVisible(true);
                this.byId("btnHdrTxt").setVisible(true);
                this.byId("btnGenPO").setVisible(true);
                this.byId("btnSaveHdr").setVisible(false);
                this.byId("btnCancelHdr").setVisible(false);
                
                var oJSONModel = new JSONModel();
                oJSONModel.setData(this._aHeaderDataBeforeChange);
    
                this.byId("headerTab").setModel(oJSONModel, "header");
                this.byId("headerTab").bindRows({path: "header>/"});                
            }
        },

        onEditDtl: function(oEvent) {
            this.setRowEditMode("detail");

            this.byId("btnEditDtl").setVisible(false);
            // this.byId("btnRefreshDtl").setVisible(false);
            this.byId("btnSaveDtl").setVisible(true);
            this.byId("btnCancelDtl").setVisible(true);
            this._aDetailsDataBeforeChange = jQuery.extend(true, [], this.getView().getModel("detail").getData());
        },

        onCancelDtl: function(oEvent) {
            if (this._bDetailsChanged) {
                var oData = {
                    Process: "details-cancel",
                    Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                }

                var oJSONModel = new JSONModel();
                oJSONModel.setData(oData);

                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(oJSONModel);
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(oJSONModel);
                    
                this._ConfirmDialog.open();
            }
            else {
                this.setRowReadMode("detail");

                this.byId("btnEditDtl").setVisible(true);
                this.byId("btnRefreshDtl").setVisible(true);
                this.byId("btnSaveDtl").setVisible(false);
                this.byId("btnCancelDtl").setVisible(false);

                var oJSONModel = new JSONModel();
                oJSONModel.setData(this._aDetailsDataBeforeChange);
    
                this.byId("detailTab").setModel(oJSONModel, "detail");
                this.byId("detailTab").bindRows({path: "detail>/"});
            }
        },

        onSaveHdr: function(oEvent) {
            var bProceed = true;

            if (this._validationErrors.length === 0) {
                this.getView().getModel("header").getData().forEach(item => {
                    if (item.PAYTERMS === "" || item.INCOTERMS === "" || item.DESTINATION === "" || item.SHIPMODE === "") {
                        bProceed = false;
                    }
                })

                if (bProceed) {
                    this.setRowReadMode("header");

                    this.byId("btnEditHdr").setVisible(true);
                    this.byId("btnUpdDate").setVisible(true);
                    this.byId("btnFabSpecs").setVisible(true);
                    this.byId("btnHdrTxt").setVisible(true);
                    this.byId("btnGenPO").setVisible(true);
                    this.byId("btnSaveHdr").setVisible(false);
                    this.byId("btnCancelHdr").setVisible(false);
                    this._bHeaderChanged = false;
                }
                else {
                    this.showMessage(this.getView().getModel("ddtext").getData()["INFO_INPUT_REQD_FIELDS"]);
                }
            }
            else  {
                var msg = this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_ENTRIES"];
                this.showMessage(msg);
            }
        },

        onSaveDtl: function(oEvent) {
            var bProceed = true;

            if (this._validationErrors.length === 0) {
                this.getView().getModel("detail").getData().forEach(item => {
                    if (item.DELVDATE === "" || item.BASEPOQTY === "") {
                        bProceed = false;
                    }
                })

                if (bProceed) {
                    this.setRowReadMode("detail");

                    this.byId("btnEditDtl").setVisible(true);
                    this.byId("btnRefreshDtl").setVisible(true);
                    this.byId("btnSaveDtl").setVisible(false);
                    this.byId("btnCancelDtl").setVisible(false);
                    this._bDetailsChanged = false;
                }
                else {
                    this.showMessage(this.getView().getModel("ddtext").getData()["INFO_INPUT_REQD_FIELDS"]);
                }
            }
            else  {
                var msg = this.getView().getModel("ddtext").getData()["INFO_CHECK_INVALID_ENTRIES"];
                this.showMessage(msg);
            }
        },

        setRowReadMode(arg) {
            var oTable = this.byId(arg + "Tab");

            oTable.getColumns().forEach((col, idx) => {
                var sColName = "";

                if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                }
                else if (col.mAggregations.template.mBindingInfos.selected !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.selected.parts[0].path;
                }
                else if (col.mAggregations.template.mBindingInfos.value !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.value.parts[0].path;
                }

                this._aColumns[arg].filter(item => item.name === sColName)
                    .forEach(ci => {
                        col.setTemplate(new sap.m.Text({text: "{" + arg + ">" + ci.name + "}"}));

                        if (ci.required) {
                            col.getLabel().removeStyleClass("requiredField");
                        }
                    })
            })

            this._bHeaderChanged = false;
            this._bDetailsChanged = false;
        },

        setRowEditMode(arg) {
            var oTable = this.byId(arg + "Tab");
            
            this._bHeaderChanged = false;
            this._bDetailsChanged = false;
            this._validationErrors = [];

            oTable.getColumns().forEach((col, idx) => {
                var sColName = "";

                if (col.mAggregations.template.mBindingInfos.text !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;
                }
                else if (col.mAggregations.template.mBindingInfos.selected !== undefined) {
                    sColName = col.mAggregations.template.mBindingInfos.selected.parts[0].path;
                }

                this._aColumns[arg].filter(item => item.name === sColName)
                    .forEach(ci => {
                        if (ci.valueHelp["show"]) {
                            col.setTemplate(new sap.m.Input({
                                type: "Text",
                                value: "{" + arg + ">" + sColName + "}",
                                // maxLength: +ci.length,
                                showValueHelp: true,
                                valueHelpRequest: this.handleValueHelp.bind(this),
                                showSuggestion: true,
                                maxSuggestionWidth: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].maxSuggestionWidth : "1px",
                                suggestionItems: {
                                    path: sColName === "SHIPMODE" ? ci.valueHelp["suggestionItems"].path : '',
                                    length: 10000,
                                    template: new sap.ui.core.ListItem({
                                        key: ci.valueHelp["suggestionItems"].text, 
                                        text: ci.valueHelp["suggestionItems"].text,
                                        additionalText: ci.valueHelp["suggestionItems"].additionalText !== undefined ? ci.valueHelp["suggestionItems"].additionalText : '',
                                    }),
                                    templateShareable: false
                                },
                                suggest: this.handleSuggestion.bind(this),
                                change: this.onValueHelpInputChange.bind(this)
                            }));
                        }
                        else if (ci.type === "NUMBER") {
                            col.setTemplate(new sap.m.Input({
                                type: sap.m.InputType.Number,
                                textAlign: sap.ui.core.TextAlign.Right,
                                // value: "{" + arg + ">" + sColName + "}",
                                value: "{path:'" + arg + ">" + sColName + "', formatOptions:{ minFractionDigits:" + ci.scale + ", maxFractionDigits:" + ci.scale + " }, constraints:{ precision:" + ci.precision + ", scale:" + ci.scale + " }}",
                                change: this.onNumberChange.bind(this)
                            }));
                        }
                        else if (ci.type === "DATE") {
                            col.setTemplate(new sap.m.DatePicker({
                                value: "{" + arg + ">" + sColName + "}",
                                displayFormat: "MM/dd/yyyy",
                                valueFormat: "MM/dd/yyyy",
                                change: this.onDateChange.bind(this)
                            }))
                        }
                        else {
                            col.setTemplate(new sap.m.Input({
                                value: "{" + arg + ">" + ci.name + "}"
                                // liveChange: this.onInputLiveChange.bind(this)
                            }));
                        }

                        if (ci.required) {
                            col.getLabel().addStyleClass("requiredField");
                        }
                    })
            })

            this.getView().getModel(arg).getData().forEach(item => item.Edited = false);
        },

        handleSuggestion: function(oEvent) {
            var me = this;
            var oInput = oEvent.getSource();
            var sModel = oInput.getBindingInfo("value").parts[0].model;
            var sInputField = oInput.getBindingInfo("value").parts[0].path;
            var oInputCtx = oEvent.getSource().getBindingContext(sModel);
            var sRowPath = oInputCtx.getPath();
            var sGroup = oInputCtx.getModel().getProperty(sRowPath + '/GROUP');

            if (sInputField === "PAYTERMS" || sInputField === "INCOTERMS" || sInputField === "DESTINATION") {
                // console.log(oInput.getSuggestionItems())
                if (oInput.getSuggestionItems().length === 0) { 
                    var oData = me.getView().getModel("payterms").getData()[sGroup];
                    var sKey = "";
                    // console.log(oData);
                    if (sInputField === "PAYTERMS") { 
                        sKey = "ZTERM";
                    }
                    else if (sInputField === "INCOTERMS") { 
                        sKey = "INCO1";
                    }
                    else if (sInputField === "DESTINATION") {
                        sKey = "INCO2";
                    }
                    
                    oInput.bindAggregation("suggestionItems", {
                        path: "payterms>/" + sGroup,
                        length: 10000,
                        template: new sap.ui.core.ListItem({
                            key: "{payterms>" + sKey + "}",
                            text: "{payterms>" + sKey + "}"
                        }),
                        templateShareable: false
                    });
                }
            }
        },

        setReqColHdrColor(arg) {
            var oTable = this.byId(arg + "Tab");

            oTable.getColumns().forEach((col, idx) => {
                var sColName = col.mAggregations.template.mBindingInfos.text.parts[0].path;

                this._aColumns[arg].filter(item => item.name === sColName)
                    .forEach(ci => {
                        if (ci.required) {
                            col.getLabel().removeStyleClass("requiredField");
                        }
                    })
            })
        },
        
        handleValueHelp: function(oEvent) {
            var oModel = this.getOwnerComponent().getModel();
            var oSource = oEvent.getSource();
            var sModel = oSource.getBindingInfo("value").parts[0].model;
            var me = this;

            this._inputId = oSource.getId();
            this._inputValue = oSource.getValue();
            this._inputSource = oSource;
            this._inputField = oSource.getBindingInfo("value").parts[0].path;

            if (this._inputField === 'SHIPMODE') {
                var vCellPath = this._inputField;
                var vColProp = this._aColumns[sModel].filter(item => item.name === vCellPath);
                var vItemValue = vColProp[0].valueHelp.items.value;
                var vItemDesc = vColProp[0].valueHelp.items.text;
                var sPath = vColProp[0].valueHelp.items.path;
                var vh = this.getView().getModel(sPath).getData();
                vh.forEach(item => {
                    item.VHTitle = item[vItemValue];
                    item.VHDesc = item[vItemDesc];
                    item.VHSelected = (item[vItemValue] === me._inputValue);
                })

                vh.sort((a,b) => (a.VHTitle > b.VHTitle ? 1 : -1));

                var oVHModel = new JSONModel({
                    items: vh,
                    title: vColProp[0].label,
                    table: sModel
                });  
                
                // create value help dialog
                if (!me._valueHelpDialog) {
                    me._valueHelpDialog = sap.ui.xmlfragment(
                        "zuiaprocess.view.fragments.valuehelp.ValueHelpDialog",
                        me
                    );
                    
                    me._valueHelpDialog.setModel(oVHModel);
                    me.getView().addDependent(me._valueHelpDialog);
                }
                else {
                    me._valueHelpDialog.setModel(oVHModel);
                }                            

                me._valueHelpDialog.open();
            }
            else {
                this._inputSourceCtx = oEvent.getSource().getBindingContext(sModel);
                var sVendor = this._inputSourceCtx.getModel().getProperty(this._inputSourceCtx.getPath() + '/VENDOR');
                var sPurchOrg = this._inputSourceCtx.getModel().getProperty(this._inputSourceCtx.getPath() + '/PURCHORG');

                if (!isNaN(sVendor)) {
                    while (sVendor.length < 10) sVendor = "0" + sVendor;
                }

                oModel.read("/PayTermsSet", {
                    urlParameters: {
                        "$filter": "LIFNR eq '" + sVendor + "' and EKORG eq '" + sPurchOrg + "'"
                    },
                    success: function (oData, oResponse) {                        
                        var sTitle = "";

                        oData.results.forEach(item => {
                            if (me._inputField === "PAYTERMS") {
                                item.VHTitle = item.ZTERM;
                                // item.VHDesc = item.ZTERM;
                                item.VHSelected = (item.ZTERM === me._inputValue);
                            }
                            else if (me._inputField === "INCOTERMS") {
                                item.VHTitle = item.INCO1;
                                // item.VHDesc = item.INCO1;
                                item.VHSelected = (item.INCO1 === me._inputValue);    
                            }
                            else if (me._inputField === "DESTINATION") {
                                item.VHTitle = item.INCO2;
                                // item.VHDesc = item.INCO2;
                                item.VHSelected = (item.INCO2 === me._inputValue);    
                            }
                        });

                        oData.results.sort((a,b) => (a.VHTitle > b.VHTitle ? 1 : -1));

                        switch (me._inputField) {
                            case "PAYTERMS": 
                                sTitle = "Payment Terms";
                                break;
                            case "INCOTERMS": 
                                sTitle = "Inco Terms";
                                break;
                            case "DESTINATION": 
                                sTitle = "Destination";
                                break;                                
                        }

                        var oVHModel = new JSONModel({
                            items: oData.results,
                            title: sTitle,
                            table: sModel
                        }); 

                        // create value help dialog
                        if (!me._valueHelpDialog) {
                            me._valueHelpDialog = sap.ui.xmlfragment(
                                "zuiaprocess.view.fragments.valuehelp.ValueHelpDialog",
                                me
                            );
                            
                            me._valueHelpDialog.setModel(oVHModel);
                            me.getView().addDependent(me._valueHelpDialog);
                        }
                        else {
                            me._valueHelpDialog.setModel(oVHModel);
                        }                            

                        me._valueHelpDialog.open();
                    },
                    error: function (err) { }
                });                
            }
            // else {
            //     var vCellPath = this._inputField;
            //     var vColProp = this._aColumns[sModel].filter(item => item.name === vCellPath);
            //     var vItemValue = vColProp[0].valueHelp.items.value;
            //     var vItemDesc = vColProp[0].valueHelp.items.text;
            //     var sEntity = vColProp[0].valueHelp.items.path;
                
            //     oModel.read(sEntity, {
            //         success: function (data, response) {
            //             data.results.forEach(item => {
            //                 item.VHTitle = item[vItemValue];
            //                 item.VHDesc = item[vItemDesc];
            //                 item.VHSelected = (item[vItemValue] === _this._inputValue);
            //             });
                        
            //             var oVHModel = new JSONModel({
            //                 items: data.results,
            //                 title: vColProp[0].label,
            //                 table: sModel
            //             });                            

            //             // create value help dialog
            //             if (!_this._valueHelpDialog) {
            //                 _this._valueHelpDialog = sap.ui.xmlfragment(
            //                     "zuigmc2.view.ValueHelpDialog",
            //                     _this
            //                 );
                            
            //                 // _this._valueHelpDialog.setModel(
            //                 //     new JSONModel({
            //                 //         items: data.results,
            //                 //         title: vColProp[0].label,
            //                 //         table: sModel
            //                 //     })
            //                 // )

            //                 _this._valueHelpDialog.setModel(oVHModel);
            //                 _this.getView().addDependent(_this._valueHelpDialog);
            //             }
            //             else {
            //                 _this._valueHelpDialog.setModel(oVHModel);
            //                 // _this._valueHelpDialog.setModel(
            //                 //     new JSONModel({
            //                 //         items: data.results,
            //                 //         title: vColProp[0].label,
            //                 //         table: sModel
            //                 //     })
            //                 // )
            //             }                            

            //             _this._valueHelpDialog.open();
            //         },
            //         error: function (err) { }
            //     })
            // }
        },

        handleValueHelpClose : function (oEvent) {
            if (oEvent.sId === "confirm") {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                // var sTable = this._valueHelpDialog.getModel().getData().table;

                if (oSelectedItem) {
                    this._inputSource.setValue(oSelectedItem.getTitle());

                    // var sRowPath = this._inputSource.getBindingInfo("value").binding.oContext.sPath;

                    if (this._inputValue !== oSelectedItem.getTitle()) {                                
                        // this.getView().getModel("mainTab").setProperty(sRowPath + '/Edited', true);

                        this._bHeaderChanged = true;
                    }
                }

                this._inputSource.setValueState("None");
            }
            else if (oEvent.sId === "cancel") {

            }
        },

        onValueHelpInputChange: function(oEvent) {
            if (this._validationErrors === undefined) this._validationErrors = [];

            var oSource = oEvent.getSource();
            var isInvalid = !oSource.getSelectedKey() && oSource.getValue().trim();
            oSource.setValueState(isInvalid ? "Error" : "None");

            // var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
            // var sModel = oSource.getBindingInfo("value").parts[0].model;

            oSource.getSuggestionItems().forEach(item => {
                if (item.getProperty("key") === oSource.getValue().trim()) {
                    isInvalid = false;
                    oSource.setValueState(isInvalid ? "Error" : "None");
                }
            })

            if (isInvalid) this._validationErrors.push(oEvent.getSource().getId());
            else {
                this._validationErrors.forEach((item, index) => {
                    if (item === oEvent.getSource().getId()) {
                        this._validationErrors.splice(index, 1)
                    }
                })
            }

            // this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            this._bHeaderChanged = true;
        },

        onNumberChange: function(oEvent) {
            if (this._validationErrors === undefined) this._validationErrors = [];

            if (oEvent.getParameters().value.split(".").length > 1) {
                if (oEvent.getParameters().value.split(".")[1].length > 3) {
                    // console.log("invalid");
                    oEvent.getSource().setValueState("Error");
                    oEvent.getSource().setValueStateText("Enter a number with a maximum of 3 decimal places.");
                    this._validationErrors.push(oEvent.getSource().getId());
                }
                else {
                    oEvent.getSource().setValueState("None");
                    this._validationErrors.forEach((item, index) => {
                        if (item === oEvent.getSource().getId()) {
                            this._validationErrors.splice(index, 1)
                        }
                    })
                }
            }
            else {
                oEvent.getSource().setValueState("None");
                this._validationErrors.forEach((item, index) => {
                    if (item === oEvent.getSource().getId()) {
                        this._validationErrors.splice(index, 1)
                    }
                })
            }
           
            // var oSource = oEvent.getSource();
            // var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
            // var sModel = oSource.getBindingInfo("value").parts[0].model;
            // this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            this._bDetailsChanged = false;
        },

        onDateChange: function(oEvent) {
            if (this._validationErrors === undefined) this._validationErrors = [];

            //check date if invalid
            // if (oEvent.getParameters().value.split(".").length > 1) {
            //     if (oEvent.getParameters().value.split(".")[1].length > 3) {
            //         // console.log("invalid");
            //         oEvent.getSource().setValueState("Error");
            //         oEvent.getSource().setValueStateText("Enter a number with a maximum of 3 decimal places.");
            //         this._validationErrors.push(oEvent.getSource().getId());
            //     }
            //     else {
            //         oEvent.getSource().setValueState("None");
            //         this._validationErrors.forEach((item, index) => {
            //             if (item === oEvent.getSource().getId()) {
            //                 this._validationErrors.splice(index, 1)
            //             }
            //         })
            //     }
            // }
            // else {
            //     oEvent.getSource().setValueState("None");
            //     this._validationErrors.forEach((item, index) => {
            //         if (item === oEvent.getSource().getId()) {
            //             this._validationErrors.splice(index, 1)
            //         }
            //     })
            // }
           
            // var oSource = oEvent.getSource();
            // var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
            // var sModel = oSource.getBindingInfo("value").parts[0].model;
            // this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            this._bDetailsChanged = false;
        },

        onUpdDate: function(oEvent) {
            var bProceed = true;

            if (this.getView().getModel("ui").getData().activeGroup === "") {
                this.getView().getModel("ui").setProperty("/activeGroup", this.getView().getModel("header").getData()[0].GROUP);
            }

            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;

            if (bProceed) {
                if (!this._ChangeDateDialog) {
                    this._ChangeDateDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ChangeDateDialog", this);
                    this.getView().addDependent(this._ChangeDateDialog);
                }
                
                
                this._ChangeDateDialog.setTitle(this.getView().getModel("ddtext").getData()["CHANGEDELVDATE"] + " - " + this.getView().getModel("ddtext").getData()["GROUP"] + " "  + sActiveGroup);
                this._ChangeDateDialog.open(); 
            }           
        },

        onChangeDate: function(oEvent) {
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;
            oDatePicker = oEvent.getSource().oParent.getContent().filter(fItem => fItem.sId === "DP1")[0];
            oDatePickerValue = oDatePicker.getProperty("value");
            // console.log(this.getView().getModel("detail").getData())

            this.getView().getModel("detail").getData().filter(fItem => fItem.GROUP === sActiveGroup).forEach(item => {
                item.DELVDATE = oDatePickerValue;
            })

            var oJSONModel = new JSONModel();
            oJSONModel.setData(this.getView().getModel("detail").getData());

            this.byId("detailTab").setModel(oJSONModel, "detail");
            this.byId("detailTab").bindRows({path: "detail>/"});
            // console.log(this.getView().getModel("detail").getData());
            // console.log(this.getOwnerComponent().getModel("CREATEPO_MODEL").getData().detail)
            this._ChangeDateDialog.close();
        },

        onCloseChangeDate: function(oEvent) {
            this._ChangeDateDialog.close();
        },
        
        onCellClick: function(oEvent) {
            // console.log(oEvent.getParameters())
            var vGroup = "";
            
            if (oEvent.getParameters().rowBindingContext !== undefined) {
                vGroup = oEvent.getParameters().rowBindingContext.getObject().GROUP;
            }

            this.getView().getModel("ui").setProperty("/activeGroup", vGroup);

            var oJSONModel = new JSONModel();
            var oDataDetail = this.getOwnerComponent().getModel("CREATEPO_MODEL").getData().detail.filter(fItem => fItem.GROUP === vGroup);
            oJSONModel.setData(oDataDetail);
            this.getView().setModel(oJSONModel, "detail");
            
            this.byId("detailTab").setModel(oJSONModel, "detail");
            this.byId("detailTab").bindRows({path: "detail>/"});
        },

        onFabSpecs: function(oEvent) {
            this._bFabSpecsChanged = false;

            if (this.getView().getModel("ui").getData().activeGroup === "") {
                this.getView().getModel("ui").setProperty("/activeGroup", this.getView().getModel("header").getData()[0].GROUP);
            }

            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;
            
            if (!this._FabSpecsDialog) {
                this._FabSpecsDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.FabSpecsDialog", this);    
                
                this._FabSpecsDialog.setModel(
                    new JSONModel({
                        items: this.getView().getModel("fabspecs").getData()[sActiveGroup]
                    }, "fs")
                )

                this.getView().addDependent(this._FabSpecsDialog);
            }
            else {
                // this._FabSpecsDialog.getModel().setProperty("/items", this.getView().getModel("fabspecs").getData()[sActiveGroup]);
                this._FabSpecsDialog.setModel(
                    new JSONModel({
                        items: this.getView().getModel("fabspecs").getData()[sActiveGroup]
                    }, "fs")
                )
            }

            this._aFabSpecsDataBeforeChange = jQuery.extend(true, [], this.getView().getModel("fabspecs").getData()[sActiveGroup]);
            
            this._FabSpecsDialog.setTitle(this.getView().getModel("ddtext").getData()["FABSPECS"] + " - " + this.getView().getModel("ddtext").getData()["GROUP"] + " " + sActiveGroup);
            this._FabSpecsDialog.open();         
        },

        onSaveFabSpecs: function(oEvent) {
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;
            this.getView().getModel("fabspecs").getData()[sActiveGroup].forEach(item => {
                item.STATUS = "UPDATED";
                item.ZZMAKT = sap.ui.getCore().byId("ZZMAKT").getValue();
                item.ZZHAFE = sap.ui.getCore().byId("ZZHAFE").getValue();
                item.ZZSHNK = sap.ui.getCore().byId("ZZSHNK").getValue();
                item.ZZCHNG = sap.ui.getCore().byId("ZZCHNG").getValue();
                item.ZZSTAN = sap.ui.getCore().byId("ZZSTAN").getValue();
                item.ZZDRY = sap.ui.getCore().byId("ZZDRY").getValue();
                item.ZZCFWA = sap.ui.getCore().byId("ZZCFWA").getValue();
                item.ZZCFCW = sap.ui.getCore().byId("ZZCFCW").getValue();
                item.ZZSHRQ = sap.ui.getCore().byId("ZZSHRQ").getValue();
                item.ZZSHDA = sap.ui.getCore().byId("ZZSHDA").getValue();
                item.PLANMONTH = sap.ui.getCore().byId("PLANMONTH1").getText();
                item.ZZREQ1 = sap.ui.getCore().byId("ZZREQ1").getValue();
                item.ZZREQ2 = sap.ui.getCore().byId("ZZREQ2").getValue();
                // item.EBELP = sap.ui.getCore().byId("EBELP").getValue();
                // item.EBELN = sap.ui.getCore().byId("EBELN").getValue();
            });
            // console.log(this.getView().getModel("ddtext").getData())
            var msg = this.getView().getModel("ddtext").getData()["INFO_FABSPECS_SAVED"];
            this.showMessage(msg)
            this._FabSpecsDialog.close();
            this._bFabSpecsChanged = false;
            // console.log(this.getView().getModel("fabspecs").getData())
        },

        onDeleteFabSpecs: function(oEvent) {
            var oData = {
                Process: "fabspecs-delete",
                Text: "Confirm delete fab specs?"
            }

            var oJSONModel = new JSONModel();
            oJSONModel.setData(oData);

            if (!this._ConfirmDialog) {
                this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                this._ConfirmDialog.setModel(oJSONModel);
                this.getView().addDependent(this._ConfirmDialog);
            }
            else this._ConfirmDialog.setModel(oJSONModel);
                
            this._ConfirmDialog.open(); 
        },

        clearFabSpecs() {
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;
            var oData = this.getView().getModel("fabspecs").getData()[sActiveGroup];
            // console.log(oData);

            Object.keys(oData[0]).forEach(key => {
                oData[0][key] = "";
            })

            oData[0].STATUS = "DELETED";           
            
            this._FabSpecsDialog.close();

            var oForm = sap.ui.getCore().byId("FabSpecsForm");
            oForm.getFormContainers()[0].getFormElements()[0].getFields()[0].setValue(" ");
            oForm.getFormContainers()[0].getFormElements()[0].getFields()[0].setValue("");
        },

        onCloseFabSpecs: function(oEvent) {
            if (this._bFabSpecsChanged) {
                var oData = {
                    Process: "fabspecs-close",
                    Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                }

                var oJSONModel = new JSONModel();
                oJSONModel.setData(oData);

                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(oJSONModel);
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(oJSONModel);
                    
                this._ConfirmDialog.open();
            }
            else this._FabSpecsDialog.close();
        },

        beforeOpenFabSpecs: function(oEvent) {
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;

            oEvent.getSource().setInitialFocus(sap.ui.getCore().byId("ZZMAKT"));
            var oData = this.getView().getModel("fabspecs").getData()[sActiveGroup];

            sap.ui.getCore().byId("ZZMAKT").setValue(oData[0].ZZMAKT);
            sap.ui.getCore().byId("ZZHAFE").setValue(oData[0].ZZHAFE);
            sap.ui.getCore().byId("ZZSHNK").setValue(oData[0].ZZSHNK);
            sap.ui.getCore().byId("ZZCHNG").setValue(oData[0].ZZCHNG);
            sap.ui.getCore().byId("ZZSTAN").setValue(oData[0].ZZSTAN);
            sap.ui.getCore().byId("ZZDRY").setValue(oData[0].ZZDRY);
            sap.ui.getCore().byId("ZZCFWA").setValue(oData[0].ZZCFWA);
            sap.ui.getCore().byId("ZZCFCW").setValue(oData[0].ZZCFCW);
            sap.ui.getCore().byId("ZZSHRQ").setValue(oData[0].ZZSHRQ);
            sap.ui.getCore().byId("ZZSHDA").setValue(oData[0].ZZSHDA);
            sap.ui.getCore().byId("PLANMONTH1").setText(oData[0].PLANMONTH);
            sap.ui.getCore().byId("ZZREQ1").setValue(oData[0].ZZREQ1);
            sap.ui.getCore().byId("ZZREQ2").setValue(oData[0].ZZREQ2);
            // sap.ui.getCore().byId("EBELP").setValue(oData[0].EBELP);
            // sap.ui.getCore().byId("EBELN").setValue(oData[0].EBELN);
        },

        onFabSpecsChange: function(oEvent) {
            this._bFabSpecsChanged = true;
        },

        onHdrText: function(oEvent) {
            this._bRemarksChanged = false;
            this._bPackInsChanged = false;

            if (this.getView().getModel("ui").getData().activeGroup === "") {
                this.getView().getModel("ui").setProperty("/activeGroup", this.getView().getModel("header").getData()[0].GROUP);
            }

            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;
            // console.log(this.getView().getModel("remarks").getData())
            if (!this._HeaderTextDialog) {
                this._HeaderTextDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.HeaderTextDialog", this);

                this._HeaderTextDialog.setModel(
                    new JSONModel({
                        rem_items: this.getView().getModel("remarks").getData()[sActiveGroup],
                        packins_items: this.getView().getModel("packins").getData()[sActiveGroup]
                    })
                )

                // console.log(this.getView().getModel("remarks").getData()[this.getView().getModel("header").getData()[0].GROUP]);
                // this._HeaderTextDialog.setModel(this.getView().getModel("remarks").getData()[this.getView().getModel("header").getData()[0].GROUP]);
                this.getView().addDependent(this._HeaderTextDialog);
            }
            else {
                this._HeaderTextDialog.getModel().setProperty("/rem_items", this.getView().getModel("remarks").getData()[sActiveGroup]);
                this._HeaderTextDialog.getModel().setProperty("/packins_items", this.getView().getModel("packins").getData()[sActiveGroup]);
            }

            this._aRemarksDataBeforeChange = jQuery.extend(true, [], this.getView().getModel("remarks").getData()[sActiveGroup]);
            this._aPackInsDataBeforeChange = jQuery.extend(true, [], this.getView().getModel("packins").getData()[sActiveGroup]);

            this._HeaderTextDialog.setTitle(this.getView().getModel("ddtext").getData()["HEADERTEXT"] + " - " + this.getView().getModel("ddtext").getData()["GROUP"] + " " + sActiveGroup);
            this._HeaderTextDialog.open(); 
        },

        onAddHdrTxt: function(oEvent) {
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;
            var activeTab = sap.ui.getCore().byId("ITB1").getSelectedKey();
            var oTable, oData;
            
            if (activeTab === "remarks") {
                oTable = sap.ui.getCore().byId("remarksTab");
                oData = oTable.getModel().getProperty('/rem_items');

                if (oData === undefined) {
                    var aDataRemItems = [];
    
                    aDataRemItems.push({
                        GROUP: sActiveGroup,
                        ITEM: "1",
                        REMARKS: "",
                        STATUS: ""
                    });
        
                    this.getView().getModel("remarks").setProperty("/" + sActiveGroup, aDataRemItems);
                    this._HeaderTextDialog.getModel().setProperty("/rem_items", this.getView().getModel("remarks").getData()[sActiveGroup]);
                }
            }
            else {
                oTable = sap.ui.getCore().byId("packinsTab");
                oData = oTable.getModel().getProperty('/packins_items');    
                
                if (oData === undefined) {
                    var aDataPackInsItems = [];
    
                    aDataPackInsItems.push({
                        GROUP: sActiveGroup,
                        ITEM: "1",
                        PACKINS: "",
                        STATUS: ""
                    });
        
                    this.getView().getModel("packins").setProperty("/" + sActiveGroup, aDataPackInsItems);
                    this._HeaderTextDialog.getModel().setProperty("/packins_items", this.getView().getModel("packins").getData()[sActiveGroup]);
                }
            }
                        
            if (oData !== undefined) {
                var length = oData.length;
                var lastSeqno = 0;
    
                if (length > 0) {
                    lastSeqno = parseInt(oData[length - 1].ITEM);
                }
    
                lastSeqno++;
    
                var seqno = lastSeqno.toString();
    
                oData.push({
                    "GROUP": sActiveGroup,
                    "ITEM": seqno,
                    "STATUS": "NEW"
                });

                oTable.getBinding("rows").refresh();
            }
        },

        onSaveHdrTxt: function(oEvent) {
            var activeTab = sap.ui.getCore().byId("ITB1").getSelectedKey();
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;

            if (activeTab === "remarks") {
                if (this._HeaderTextDialog.getModel().getData().rem_items.filter(item => item.REMARKS === "").length > 0) {
                    this.showMessage(this.getView().getModel("ddtext").getData()["INFO_INPUT_REMARKS"]);
                }
                else {
                    this._bRemarksChanged = false;
                    this.showMessage(this.getView().getModel("ddtext").getData()["INFO_REMARKS_SAVED"]);

                    // this.getView().getModel("remarks").getData().forEach(item => item.STATUS = "UPDATED");
                    this.getView().getModel("remarks").getData()[sActiveGroup].forEach(item => item.STATUS = "UPDATED");
                    // console.log(this.getView().getModel("remarks").getData())
                }
            }
            else {
                if (this._HeaderTextDialog.getModel().getData().packins_items.filter(item => item.PACKINS === "").length > 0) {
                    this.showMessage(this.getView().getModel("ddtext").getData()["INFO_INPUT_PACKINS"]);
                }
                else {
                    // this._HeaderTextDialog.close();
                    this._bPackInsChanged = false;
                    this.showMessage(this.getView().getModel("ddtext").getData()["INFO_PACKINS_SAVED"]);
                    this.getView().getModel("packins").getData()[sActiveGroup].forEach(item => item.STATUS = "UPDATED");
                    // this.getView().getModel("packins").getData().forEach(item => item.STATUS = "UPDATED");
                }
            }
        },

        onDeleteHdrTxt: function(oEvent) {
            var activeTab = sap.ui.getCore().byId("ITB1").getSelectedKey();
            var oTable, sProcess;

            if (activeTab === "remarks") {
                oTable = sap.ui.getCore().byId("remarksTab");
                sProcess = "remarks-delete";
            } 
            else {
                oTable = sap.ui.getCore().byId("packinsTab");
                sProcess = "packins-delete";
            }

            if (oTable.getSelectedIndices().length === 0) {
                this.showMessage(this.getView().getModel("ddtext").getData()["INFO_SEL_RECORD_TO_DELETE"]);
            }
            else {
                var oData = {
                    Process: sProcess,
                    Text: this.getView().getModel("ddtext").getData()["CONF_DELETE_RECORDS"]
                }

                var oJSONModel = new JSONModel();
                oJSONModel.setData(oData);
                // console.log(oData)
                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(oJSONModel);
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(oJSONModel);
                    
                this._ConfirmDialog.open(); 
            }
        },

        onCloseHdrTxt: function(oEvent) {
            var activeTab = sap.ui.getCore().byId("ITB1").getSelectedKey();
            var oData;
            var bProceed = true;
            var iNew = 0;

            // console.log(this._HeaderTextDialog.getModel().getData())
            if (activeTab === "remarks") {
                if (this._HeaderTextDialog.getModel().getData().rem_items !== undefined) {
                    iNew = this._HeaderTextDialog.getModel().getData().rem_items.filter(item => item.STATUS === "NEW").length;
                }

                if (this._bRemarksChanged || iNew > 0) {
                    bProceed = false;

                    oData = {
                        Process: "remarks-close",
                        Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                    }
                }
            }
            else {
                if (this._HeaderTextDialog.getModel().getData().packins_items !== undefined) {
                    iNew = this._HeaderTextDialog.getModel().getData().packins_items.filter(item => item.STATUS === "NEW").length;
                }

                if (this._bPackInsChanged || iNew > 0) {
                    bProceed = false;

                    oData = {
                        Process: "packins-close",
                        Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                    }
                }
            }

            if (!bProceed) {
                var oJSONModel = new JSONModel();
                oJSONModel.setData(oData);

                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(oJSONModel);
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(oJSONModel);
                    
                this._ConfirmDialog.open();
            }
            else this._HeaderTextDialog.close();
        },

        onRemarksChange: function(oEvent) {
            this._bRemarksChanged = true;
        },

        onPackInsChange: function(oEvent) {
            this._bPackInsChanged = true;
        },

        onSelectHdrTxtTab: function(oEvent) {
            var activeTab = sap.ui.getCore().byId("ITB1").getSelectedKey();
            var bProceed = true;
            var iNew = 0;
            // console.log(activeTab)

            if (activeTab === "remarks") {
                if (this._HeaderTextDialog.getModel().getData().rem_items !== undefined) {
                    iNew = this._HeaderTextDialog.getModel().getData().rem_items.filter(item => item.STATUS === "NEW").length;
                }

                if (this._bPackInsChanged || iNew > 0) {
                    bProceed = false;

                    oData = {
                        Process: "packins-cancel",
                        Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                    }
                }
            }
            else {
                if (this._HeaderTextDialog.getModel().getData().packins_items !== undefined) {
                    iNew = this._HeaderTextDialog.getModel().getData().packins_items.filter(item => item.STATUS === "NEW").length;
                }

                if (this._bRemarksChanged || iNew > 0) {
                    bProceed = false;

                    oData = {
                        Process: "remarks-cancel",
                        Text: this.getView().getModel("ddtext").getData()["CONFIRM_DISREGARD_CHANGE"]
                    }
                }
            }

            if (!bProceed) {
                var oJSONModel = new JSONModel();
                oJSONModel.setData(oData);

                if (!this._ConfirmDialog) {
                    this._ConfirmDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.ConfirmDialog", this);

                    this._ConfirmDialog.setModel(oJSONModel);
                    this.getView().addDependent(this._ConfirmDialog);
                }
                else this._ConfirmDialog.setModel(oJSONModel);
                    
                this._ConfirmDialog.open();
            }
        },

        showMessage: function(oMessage, iDuration) {
            if (iDuration === undefined) iDuration = 2000;

			sap.m.MessageToast.show(oMessage, {
				duration: iDuration,
				animationDuration: 500,
                at: "center center"
			});
		},

        onCloseConfirmDialog: function(oEvent) {
            var sActiveGroup = this.getView().getModel("ui").getData().activeGroup;

            if (this._ConfirmDialog.getModel().getData().Process === "remarks-close") {
                this._bRemarksChanged = false;
                this._HeaderTextDialog.close();

                // var oData = this.getView().getModel("remarks").getData();
                // oData[sActiveGroup] = this._aRemarksDataBeforeChange;
                this.getView().getModel("remarks").setProperty('/' + sActiveGroup, this._aRemarksDataBeforeChange);
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "packins-close") {
                this._bPackInsChanged = false;
                this._HeaderTextDialog.close();

                this.getView().getModel("packins").setProperty('/' + sActiveGroup, this._aPackInsDataBeforeChange);
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "fabspecs-close") {
                // this.clearFabSpecs();
                this.getView().getModel("fabspecs").setProperty('/' + sActiveGroup, this._aFabSpecsDataBeforeChange);
                this._bFabSpecsChanged = false;
                this._FabSpecsDialog.close();
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "remarks-delete") {
                var oTable = sap.ui.getCore().byId("remarksTab");
                // var oTableModel = oTable.getModel();
                var oData = this._HeaderTextDialog.getModel().getData().rem_items; //oTableModel.getProperty('/rem_items');
                var selected = oTable.getSelectedIndices();

                oData = oData.filter(function (value, index) {
                    return selected.indexOf(index) === -1;
                })
                // console.log(oData)
                // oTableModel.setData(oData);
                oTable.clearSelection();
                // oTable.getBinding("rows").refresh();
                this._HeaderTextDialog.getModel().setProperty("/rem_items", oData);
                this.getView().getModel("remarks").setProperty("/" + sActiveGroup,  oData);

                if (oData.length === 0) this._bRemarksChanged = false;
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "packins-delete") {
                var oTable = sap.ui.getCore().byId("packinsTab");
                // var oTableModel = oTable.getModel();
                var oData = this._HeaderTextDialog.getModel().getData().packins_items; //oTableModel.getProperty('/packins_items');
                var selected = oTable.getSelectedIndices();
                
                oData = oData.filter(function (value, index) {
                    return selected.indexOf(index) === -1;
                })
                
                // oTableModel.setData(oData);
                oTable.clearSelection();
                // oTable.getBinding("rows").refresh();    
                
                this._HeaderTextDialog.getModel().setProperty("/packins_items", oData);
                this.getView().getModel("packins").setProperty("/" + sActiveGroup,  oData);

                if (oData.length === 0) this._bPackInsChanged = false;
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "fabspecs-delete") {
                this.clearFabSpecs();
                this._bFabSpecsChanged = false;
                this._FabSpecsDialog.close();
                this.showMessage(this.getView().getModel("ddtext").getData()["INFO_DATA_DELETED"]);
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "remarks-cancel") {
                this._bRemarksChanged = false;

                // var oTable = sap.ui.getCore().byId("remarksTab");
                // var oTableModel = oTable.getModel("remarks");
                // oTableModel.setData(this._aRemarksDataBeforeChange);
                this.getView().getModel("remarks").setProperty('/' + sActiveGroup, this._aRemarksDataBeforeChange);
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "packins-cancel") {
                this._bPackInsChanged = false;

                // var oTable = sap.ui.getCore().byId("packinsTab");
                // var oTableModel = oTable.getModel("packins");
                // oTableModel.setData(this._aPackInsDataBeforeChange);
                this.getView().getModel("packins").setProperty('/' + sActiveGroup, this._aPackInsDataBeforeChange);
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "header-cancel") {
                this.setRowReadMode("header");

                this.byId("btnEditHdr").setVisible(true);
                this.byId("btnUpdDate").setVisible(true);
                this.byId("btnFabSpecs").setVisible(true);
                this.byId("btnHdrTxt").setVisible(true);
                this.byId("btnGenPO").setVisible(true);
                this.byId("btnSaveHdr").setVisible(false);
                this.byId("btnCancelHdr").setVisible(false);
                // this.getView().getModel("detail").setProperty("/", this._aHeaderDataBeforeChange);

                var oJSONModel = new JSONModel();
                oJSONModel.setData(this._aHeaderDataBeforeChange);
    
                this.byId("headerTab").setModel(oJSONModel, "header");
                this.byId("headerTab").bindRows({path: "header>/"});
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "details-cancel") {
                this.setRowReadMode("detail");

                this.byId("btnEditDtl").setVisible(true);
                this.byId("btnRefreshDtl").setVisible(true);
                this.byId("btnSaveDtl").setVisible(false);
                this.byId("btnCancelDtl").setVisible(false);
                
                var oJSONModel = new JSONModel();
                oJSONModel.setData(this._aDetailsDataBeforeChange);
    
                this.byId("detailTab").setModel(oJSONModel, "detail");
                this.byId("detailTab").bindRows({path: "detail>/"});
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "po-cancel") {
                var oHistory, sPreviousHash;
            
                if (sap.ui.core.routing.History !== undefined) {
                    oHistory = sap.ui.core.routing.History.getInstance();
                    sPreviousHash = oHistory.getPreviousHash();
                }
    
                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else { 
                    var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                    oRouter.navTo("RouteMain", {}, true /*no history*/);
                }
    
                this.setRowReadMode("header");
                this.setRowReadMode("detail");

                // sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = this._fBackButton;
            }

            this._ConfirmDialog.close();
        },  

        onCancelConfirmDialog: function(oEvent) {
            if (this._ConfirmDialog.getModel().getData().Process === "remarks-cancel") {
                sap.ui.getCore().byId("ITB1").setSelectedKey("remarks");
                sap.ui.getCore().byId("ITB1").selectedKey = "remarks";
            }
            else if (this._ConfirmDialog.getModel().getData().Process === "packins-cancel") {
                sap.ui.getCore().byId("ITB1").setSelectedKey("packins");
                sap.ui.getCore().byId("ITB1").selectedKey = "packins";
            }

            this._ConfirmDialog.close();
        },

        onGeneratePO: function(oEvent) {
            this._aCreatePOResult = [];
            // console.log(this.getView().getModel("remarks").getData())
            var me = this;
            var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
            var vSBU = this.getOwnerComponent().getModel("UI_MODEL").getData().sbu;
            var bProceed = true;

            this.getView().getModel("header").getData().forEach(item => {
                if (item.PAYTERMS === "" || item.INCOTERMS == "" || item.DESTINATION == "" || item.SHIPMODE == "") {
                    bProceed = false;
                }
            })

            if (bProceed) {
                this.getView().getModel("detail").getData().forEach(item => {
                    if (item.DELVDATE === "" || item.BASEPOQTY == "" || item.GROSSPRICE == "") {
                        bProceed = false;
                    }
                })
            }

            if (bProceed) {
                me.showLoadingDialog('Processing...');
                var iCounter = 0;

                this.getView().getModel("header").getData().forEach(item => {
                    // console.log(vSBU, item.DOCTYPE, item.COMPANY)

                    setTimeout(() => {
                        this._oModel.read("/GetNoRangeCodeSet", {
                            urlParameters: {
                                "$filter": "SBU eq '" + vSBU + "' and DOCTYP eq '" + item.DOCTYPE + "' and COMPANY eq '" +  item.COMPANY + "'"
                            },
                            // async: false,
                            success: function (oData, oResponse) {
                                // console.log(oData)
                                if (oData.results.length === 0) {
                                    iCounter++;
                                    // me.showMessage("No number range code retrieve.");
                                    me._aCreatePOResult.push({
                                        GROUP: item.GROUP,
                                        VENDOR: item.VENDOR,
                                        PURCHORG: item.PURCHORG,
                                        PURCHGRP: item.PURCHGRP,
                                        REMARKS: "No number range code retrieve."
                                    })
    
                                    if (iCounter === me.getView().getModel("header").getData().length) {
                                        me.closeLoadingDialog();
                                        me.showGeneratePOResult();
                                    }
                                }
                                else {
                                    var oParam = {};
                        
                                    oParam["EReturnno"] = "";
                                    oParam['N_GetNumberParam'] = [{
                                        "INorangecd": oData.results[0].NORANGECD,
                                        "IKeycd": "",
                                        "IUserid": "",
                                    }];
                                    oParam['N_GetNumberReturn'] = [];
                        
                                    oModel.create("/GetNumberSet", oParam, {
                                        method: "POST",
                                        success: function(oResult, oResponse) {
                                            // console.log(oResult)
                                            // console.log(oResult.EReturnno)
            
                                            if (oResult.EReturnno === "") {
                                                iCounter++;
                                                // me.showMessage(oResult.N_GetNumberReturn[0].Type + " " + oResult.N_GetNumberReturn[0].Message);
                                                me._aCreatePOResult.push({
                                                    GROUP: item.GROUP,
                                                    VENDOR: item.VENDOR,
                                                    PURCHORG: item.PURCHORG,
                                                    PURCHGRP: item.PURCHGRP,
                                                    REMARKS: oResult.N_GetNumberReturn.results[0].Type + " " + oResult.N_GetNumberReturn.results[0].Message
                                                })
    
                                                if (iCounter === me.getView().getModel("header").getData().length) {
                                                    me.closeLoadingDialog();
                                                    me.showGeneratePOResult();
                                                }
                                            }
                                            else {
                                                var oParamCPO = {};
                                                var oParamCPOHdrData = [{
                                                    DocDate: sapDateFormat.format(new Date(item.PODATE)) + "T00:00:00",
                                                    DocType: item.DOCTYPE,
                                                    CoCode: item.COMPANY,
                                                    PurchOrg: item.PURCHORG,
                                                    PurGroup: item.PURCHGRP,
                                                    Vendor: item.VENDOR,
                                                    PoNumber: oResult.EReturnno,
                                                    CreatDate: sapDateFormat.format(new Date(item.PODATE)) + "T00:00:00",
                                                    Pmnttrms: item.PAYTERMS,
                                                    Currency: item.CURR,
                                                    ExchRate: item.EXRATE === "" ? "0" : item.EXRATE,
                                                    Incoterms1: item.INCOTERMS,
                                                    Incoterms2: item.DESTINATION,
                                                    OurRef: item.SHIPTOPLANT
                                                }];
        
                                                var oParamCPOHdrTextData = [];
        
                                                me.getView().getModel("remarks").getData()[item.GROUP].filter(fItem => fItem.STATUS === "UPDATED")
                                                    .forEach(rem => {
                                                        // var sItem = rem.ITEM;
                                                        // while (sItem.length < 5) sItem = "0" + sItem;
        
                                                        oParamCPOHdrTextData.push({
                                                            PoNumber: oResult.EReturnno,
                                                            PoItem: "00000",
                                                            TextId: "F01",
                                                            TextForm: "*",
                                                            TextLine: rem.REMARKS
                                                        })
                                                    })
        
                                                me.getView().getModel("packins").getData()[item.GROUP].filter(fItem => fItem.STATUS === "UPDATED")
                                                    .forEach(rem => {
                                                        // var sItem = rem.ITEM;
                                                        // while (sItem.length < 5) sItem = "0" + sItem;
        
                                                        oParamCPOHdrTextData.push({
                                                            PoNumber: oResult.EReturnno,
                                                            PoItem: "00000",
                                                            TextId: "F06",
                                                            TextForm: "*",
                                                            TextLine: rem.PACKINS
                                                        })
                                                    }) 
                                                    
                                                var oParamCPOAddtlDtlsData = [];
                                                me.getView().getModel("fabspecs").getData()[item.GROUP].filter(fItem => fItem.STATUS === "UPDATED")
                                                .forEach(fs => {
                                                    if (fs.ZZSHDA !== "") {
                                                        oParamCPOAddtlDtlsData.push({
                                                            PoNumber: oResult.EReturnno,
                                                            PoItem: "00000",
                                                            Zzhafe: fs.ZZHAFE,
                                                            Zzshnk: fs.ZZSHNK,
                                                            Zzcfwa: fs.ZZCFWA,
                                                            Zzchng: fs.ZZCHNG,
                                                            Zzstan: fs.ZZSTAN,
                                                            Zzcfcw: fs.ZZCFCW,
                                                            Zzdry: fs.ZZDRY,
                                                            Zzreq1: fs.ZZREQ1,
                                                            Zzreq2: fs.ZZREQ2,
                                                            Zzshrq: fs.ZZSHRQ,
                                                            Zzshda: sapDateFormat.format(new Date(fs.ZZSHDA)) + "T00:00:00",
                                                            Zzprmo: fs.PLANMONTH.slice(4,6),
                                                            Zzpryr: fs.PLANMONTH.slice(0,4),
                                                            Zzmakt: fs.ZZMAKT
                                                        })
                                                    }
                                                    else {
                                                        oParamCPOAddtlDtlsData.push({
                                                            PoNumber: oResult.EReturnno,
                                                            PoItem: "00000",
                                                            Zzhafe: fs.ZZHAFE,
                                                            Zzshnk: fs.ZZSHNK,
                                                            Zzcfwa: fs.ZZCFWA,
                                                            Zzchng: fs.ZZCHNG,
                                                            Zzstan: fs.ZZSTAN,
                                                            Zzcfcw: fs.ZZCFCW,
                                                            Zzdry: fs.ZZDRY,
                                                            Zzreq1: fs.ZZREQ1,
                                                            Zzreq2: fs.ZZREQ2,
                                                            Zzshrq: fs.ZZSHRQ,
                                                            Zzprmo: fs.PLANMONTH.slice(5,6),
                                                            Zzpryr: fs.PLANMONTH.slice(0,4),
                                                            Zzmakt: fs.ZZMAKT
                                                        })
                                                    }
                                                })                                                 
                                                
                                                var oParamCPOItemData = [];
                                                var oParamCPOItemSchedData = [];
        
                                                me.getOwnerComponent().getModel("CREATEPO_MODEL").getData().detail.filter(fItem => fItem.GROUP === item.GROUP)
                                                    .forEach(poitem => {
                                                        oParamCPOItemData.push({
                                                            PoNumber: oResult.EReturnno,
                                                            PoItem: poitem.ITEM,
                                                            Material: poitem.MATERIALNO,
                                                            InfoRec: poitem.INFOREC,
                                                            MatGrp: poitem.MATERIALGRP,
                                                            ShortText: poitem.GMCDESCEN.length > 40 ? poitem.GMCDESCEN.slice(0, 40) : poitem.GMCDESCEN,
                                                            Plant: poitem.PURCHPLANT,
                                                            PoUnit: poitem.BASEUOM,
                                                            OrderprUn: poitem.BASEUOM,
                                                            NetPrice: "0",
                                                            PriceUnit: "0",
                                                            ConvNum1: "0",
                                                            ConvDen1: "0",
                                                            DispQuant: poitem.BASEPOQTY,
                                                            GrBasediv: poitem.GRBASEDIV,
                                                            PreqNo: poitem.PRNUMBER,
                                                            PreqItem: poitem.PRITEMNO
                                                        })
        
                                                        oParamCPOItemSchedData.push({
                                                            PoItem: poitem.ITEM,
                                                            SchedLine: "1",
                                                            DelivDate: sapDateFormat.format(new Date(poitem.DELVDATE)) + "T00:00:00",
                                                            Quantity: poitem.BASEPOQTY,
                                                            PreqNo: poitem.PRNUMBER,
                                                            PreqItem: poitem.PRITEMNO
                                                        })                                            
                                                    })
        
                                                oParamCPO["PONumber"] = "";
                                                oParamCPO['N_CreatePOHdrParam'] = oParamCPOHdrData;
                                                oParamCPO['N_CreatePOHdrTextParam'] = oParamCPOHdrTextData;
                                                oParamCPO['N_CreatePOItemParam'] = oParamCPOItemData;
                                                oParamCPO['N_CreatePOItemSchedParam'] = oParamCPOItemSchedData;
                                                oParamCPO['N_CreatePOAddtlDtlsParam'] = oParamCPOAddtlDtlsData;
                                                oParamCPO['N_CreatePOItemTextParam'] = [];
                                                oParamCPO['N_CreatePOReturn'] = [];
                                                    
                                                console.log(oParamCPO);
                                                
                                                oModel.create("/CreatePOSet", oParamCPO, {
                                                    method: "POST",
                                                    success: function(oResult, oResponse) {
                                                        iCounter++;
                                                        me.closeLoadingDialog();
                                                        console.log(oResult);
                                                        var oRetMsgs = oResult.N_CreatePOReturn.results;

                                                        me._aCreatePOResult.push({
                                                            GROUP: item.GROUP,
                                                            VENDOR: item.VENDOR,
                                                            PURCHORG: item.PURCHORG,
                                                            PURCHGRP: item.PURCHGRP,
                                                            REMARKS: oRetMsgs[0].Type + ": " + oRetMsgs[0].Message
                                                        })

                                                        if (oRetMsgs[0].Type === "S") {
                                                            me._poCreated = true;
                                                        }

                                                        if (iCounter === me.getView().getModel("header").getData().length) {
                                                            me.showGeneratePOResult();
                                                        }
                                                    },
                                                    error: function(err) {
                                                        iCounter++;
                                                        // console.log(err);
                                                        me.closeLoadingDialog();
                                                        me._aCreatePOResult.push({
                                                            GROUP: item.GROUP,
                                                            VENDOR: item.VENDOR,
                                                            PURCHORG: item.PURCHORG,
                                                            PURCHGRP: item.PURCHGRP,
                                                            REMARKS: err
                                                        })
    
                                                        if (iCounter === me.getView().getModel("header").getData().length) {
                                                            me.showGeneratePOResult();
                                                        }
                                                    }
                                                });
                                            }
                                        },
                                        error: function(err) {
                                            iCounter++;
                                            me.closeLoadingDialog();
                                            me._aCreatePOResult.push({
                                                GROUP: item.GROUP,
                                                VENDOR: item.VENDOR,
                                                PURCHORG: item.PURCHORG,
                                                PURCHGRP: item.PURCHGRP,
                                                REMARKS: err
                                            })
    
                                            if (iCounter === me.getView().getModel("header").getData().length) {
                                                me.showGeneratePOResult();
                                            }
                                        }
                                    });
                                }
                            },
                            error: function (err) { 
                                iCounter++;
                                me.closeLoadingDialog();
                                me._aCreatePOResult.push({
                                    GROUP: item.GROUP,
                                    VENDOR: item.VENDOR,
                                    PURCHORG: item.PURCHORG,
                                    PURCHGRP: item.PURCHGRP,
                                    REMARKS: err
                                })
    
                                if (iCounter === me.getView().getModel("header").getData().length) {
                                    me.showGeneratePOResult();
                                }
                            }
                        });                        
                    }, 500);
                })
            }
            else {
                // console.log(this.getView().getModel("ddtext").getData()["INFO_CREATE_PO_CHECK_REQD"])
                this.showMessage(this.getView().getModel("ddtext").getData()["INFO_CREATEPO_CHECK_REQD"], 5000);
            }
        },

        showLoadingDialog(arg) {
            if (!this._LoadingDialog) {
                this._LoadingDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.LoadingDialog", this);
                this.getView().addDependent(this._LoadingDialog);
            }
            // jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._LoadingDialog);
            
            this._LoadingDialog.setTitle(arg);
            this._LoadingDialog.open();
        },

        closeLoadingDialog() {
            this._LoadingDialog.close();
        },

        showGeneratePOResult() {
            // console.log(this._aCreatePOResult)
            // display pop-up for user selection
            if (!this._GeneratePOResultDialog) {
                this._GeneratePOResultDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.GeneratePOResultDialog", this);

                this._GeneratePOResultDialog.setModel(
                    new JSONModel({
                        items: this._aCreatePOResult,
                        rowCount: this._aCreatePOResult.length
                    })
                )

                this.getView().addDependent(this._GeneratePOResultDialog);
            }
            else {
                this._GeneratePOResultDialog.getModel().setProperty("/items", this._aCreatePOResult);
                this._GeneratePOResultDialog.getModel().setProperty("/rowCount", this._aCreatePOResult.length);
            }

            this._GeneratePOResultDialog.setTitle("Create PO Result");
            this._GeneratePOResultDialog.open();
        },

        onCreatePOResultClose: function(oEvent) {
            this._GeneratePOResultDialog.close();
            // sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = this._fBackButton;

            if (this._poCreated) this.getOwnerComponent().getModel("UI_MODEL").setProperty("/flag", true);
            // var oRouter = sap.ui.core.UIComponent.getRouterFor(me);
            // oRouter.navTo("RouteMain");

            var oHistory, sPreviousHash;
            
            if (sap.ui.core.routing.History !== undefined) {
                oHistory = sap.ui.core.routing.History.getInstance();
                sPreviousHash = oHistory.getPreviousHash();
            }

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else { 
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("RouteMain", {}, true /*no history*/);
            }

            this.setRowReadMode("header");
            this.setRowReadMode("detail");            
        },

    })
})