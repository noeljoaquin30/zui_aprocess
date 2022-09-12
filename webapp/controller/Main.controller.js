sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "../js/Common"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Common, MessageBox) {
        "use strict";

        var that;
        var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "MM/dd/yyyy" });
        var sapDateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "yyyy-MM-dd" });

        return Controller.extend("zuiaprocess.controller.Main", {
            onInit: function () {
                that = this;
                // console.log(Common);
                // Common.showMessage('test');
                // Common.openLoadingDialog(that);

                this.showLoadingDialog('Loading...');
                this.getColumns();

                this._counts = {
                    total: 0,
                    unassigned: 0,
                    partial: 0
                }

                var oJSONDataModel = new JSONModel(); 
                oJSONDataModel.setData(this._counts);

                // oJSONDataModel.setData(oData);
                this.getView().setModel(oJSONDataModel, "counts");

                this.setSmartFilterModel();

                this._oAssignVendorData = [];

                // console.log(sapDateFormat.format(new Date("09/01/2022")))

                // this._AssignVendorDialog = null;
                // console.log(this.getView().getModel("counts").getData())
                // jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._LoadingDialog);
                // console.log(this.getOwnerComponent().getModel("ZVB_3DERP_ANP_FILTERS_CDS"))

                // var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_ANP_FILTERS_CDS");
                // oModel.read("/ZVB_3DERP_VENDOR_SH", {
                //     success: function (oData, oResponse) {
                //         console.log(oData);
                //     },
                //     error: function (err) { 

                //     }
                // });

            },

            getColumns() {
                var me = this;

                //get dynamic columns based on saved layout or ZERP_CHECK
                var oJSONColumnsModel = new JSONModel();
                // this.oJSONModel = new JSONModel();

                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                // console.log(oModel)
                oModel.setHeaders({
                    sbu: 'VER',
                    type: 'APROCESS',
                    tabname: 'ZDV_3DERP_ANP'
                });

                oModel.read("/ColumnsSet", {
                    success: function (oData, oResponse) {
                        // console.log(oData);
                        oJSONColumnsModel.setData(oData);
                        // me.oJSONModel.setData(oData);
                        me.getView().setModel(oJSONColumnsModel, "columns"); //set the view model
                        me.getTableData(oData.results);
                    },
                    error: function (err) {
                        Common.closeLoadingDialog(that);
                    }
                });
            },

            getTableData: function (columns) {
                var me = this;
                var oModel = this.getOwnerComponent().getModel();

                //get styles data for the table
                var oJSONDataModel = new JSONModel(); 
                // var aFilters = this.getView().byId("SmartFilterBar").getFilters();
                // var oText = this.getView().byId("StylesCount"); //for the count of selected styles
                // this.addDateFilters(aFilters); //date not automatically added to filters

                oModel.read("/MainSet", {
                    // filters: aFilters,
                    success: function (oData, oResponse) {
                        var vUnassigned = 0, vPartial = 0;

                        oData.results.forEach(item => {
                            if (item.VENDOR === '') vUnassigned++;
                            if (item.QTY !== item.ORDERQTY) vPartial++;
                            item.DELVDATE = dateFormat.format(item.DELVDATE);
                        })

                        me._counts.total = oData.results.length;
                        me._counts.unassigned = vUnassigned;
                        me._counts.partial = vPartial;
                        me.getView().getModel("counts").setData(me._counts);

                        // Common.closeLoadingDialog(that);
                        me.closeLoadingDialog();
                        // oText.setText(oData.results.length + "");
                        oJSONDataModel.setData(oData);
                        me.getView().setModel(oJSONDataModel, "mainData");
                        me.setTableData();
                        me.setTableColumns();
                        // me.setChangeStatus(false);
                    },
                    error: function (err) { 
                        Common.closeLoadingDialog(that);
                    }
                });
            },

            setTableData: function () {
                var me = this;

                //the selected dynamic columns
                var oColumnsModel = this.getView().getModel("columns");
                var oDataModel = this.getView().getModel("mainData");

                //the selected styles data
                var oColumnsData = oColumnsModel.getProperty('/results');
                var oData = oDataModel.getProperty('/results');
                // console.log(oDataModel)
                //set the column and data model
                var oModel = new JSONModel();

                oModel.setData({
                    columns: oColumnsData,
                    rows: oData
                });

                var oTable = this.getView().byId("mainTab");
                oTable.setModel(oModel);

                //bind the data to the table
                oTable.bindRows("/rows");
            },

            setTableColumns() {
                var me = this;
                var oTable = this.getView().byId("mainTab");

                //bind the dynamic column to the table
                oTable.bindColumns("/columns", function (index, context) {
                    var sColumnId = context.getObject().ColumnName;
                    var sColumnLabel = context.getObject().ColumnLabel;
                    var sColumnType = context.getObject().ColumnType;
                    var sColumnWidth = context.getObject().ColumnWidth;
                    var sColumnVisible = context.getObject().Visible;
                    var sColumnSorted = context.getObject().Sorted;
                    var sColumnSortOrder = context.getObject().SortOrder;
                    // var sColumnToolTip = context.getObject().Tooltip;
                    //alert(sColumnId.);

                    if (sColumnWidth === 0) sColumnWidth = 7;

                    return new sap.ui.table.Column({
                        id: sColumnId,
                        label: sColumnLabel,
                        template: me.columnTemplate(sColumnId, sColumnType),
                        width: sColumnWidth + 'rem',
                        sortProperty: sColumnId,
                        filterProperty: sColumnId,
                        autoResizable: true,
                        visible: sColumnVisible,
                        sorted: sColumnSorted,
                        sortOrder: ((sColumnSorted === true) ? sColumnSortOrder : "Ascending" )
                    });
                });
            },

            columnTemplate: function (sColumnId, sColumnType) {
                var oColumnTemplate;

                oColumnTemplate = new sap.m.Text({ text: "{" + sColumnId + "}" }); //default text

                // //different component based on field
                // if (sColumnId === "STATUSCD") { //display infolabel for Status Code
                //     oColumnTemplate = new sap.tnt.InfoLabel({
                //         text: "{" + sColumnId + "}",
                //         colorScheme: "{= ${" + sColumnId + "} === 'CMP' ? 8 : ${" + sColumnId + "} === 'CRT' ? 3 : 1}"
                //     })
                // } else if (sColumnType === "SEL") { //Manage button
                //     oColumnTemplate = new sap.m.Button({
                //         text: "",
                //         icon: "sap-icon://detail-view",
                //         type: "Ghost",
                //         press: this.goToDetail,
                //         tooltip: "Manage this style"
                //     });
                //     oColumnTemplate.data("StyleNo", "{}"); //custom data to hold style number
                // } else if (sColumnType === "COPY") { //Copy button
                //     oColumnTemplate = new sap.m.Button({
                //         text: "",
                //         icon: "sap-icon://copy",
                //         type: "Ghost",
                //         press: this.onCopyStyle,
                //         tooltip: "Copy this style"
                //     });
                //     oColumnTemplate.data("StyleNo", "{}"); //custom data to hold style number
                // } else {
                //     oColumnTemplate = new sap.m.Text({ text: "{" + sColumnId + "}" }); //default text
                // }

                return oColumnTemplate;
            },

            getColumnSize: function (sColumnId, sColumnType) {
                //column width of fields
                var mSize = '7rem';
                // if (sColumnType === "SEL") {
                //     mSize = '5rem';
                // } else if (sColumnType === "COPY") {
                //     mSize = '4rem';
                // } else if (sColumnId === "STYLECD") {
                //     mSize = '25rem';
                // } else if (sColumnId === "DESC1" || sColumnId === "PRODTYP") {
                //     mSize = '15rem';
                // }
                return mSize;
            },

            setSmartFilterModel: function () {
                //Model StyleHeaderFilters is for the smartfilterbar
                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_ANP_FILTERS_CDS");
                // console.log(oModel)
                var oSmartFilter = this.getView().byId("smartFilterBar");
                oSmartFilter.setModel(oModel);
                
                // console.log(oModel)

                // oModel.read("/ZVB_3DERP_VENDOR_SH", {
                //     success: function (oData, oResponse) {
                //         console.log(oData)
                //     },
                //     error: function (err) { 
                //     }
                // });
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

            showMessage: function(oMessage) {
                MessageToast.show(oMessage, {
                    duration: 3000,
                    animationDuration: 500
                });
            },

            onSearch: function () {
                //trigger search, reselect styles                
                // console.log(this.getView().byId("smartFilterBar").getFilterData());
                // console.log(this.getView().byId("smartFilterBar").getFilters());
                this.byId("searchFieldMain").setProperty("value", "");
                this.showLoadingDialog('Loading...');

                var me = this;
                var oModel = this.getOwnerComponent().getModel();
                var aFilters = this.getView().byId("smartFilterBar").getFilters();
                var oJSONDataModel = new JSONModel();                 
                // console.log(aFilters)
                if (aFilters.length > 0) {
                    aFilters[0].aFilters.forEach(item => {
                        console.log(item)
                        if (item.sPath === 'VENDOR') {
                            if (!isNaN(item.oValue1)) {
                                while (item.oValue1.length < 10) item.oValue1 = "0" + item.oValue1;
                            }
                        }
                    })
                }

                // console.log(aFilters)

                oModel.read("/MainSet", { 
                    filters: aFilters,
                    success: function (oData, oResponse) {
                        var vUnassigned = 0, vPartial = 0;
                        console.log(oData)
                        oData.results.forEach(item => {
                            if (item.VENDOR === '') vUnassigned++;
                            if (item.QTY !== item.ORDERQTY) vPartial++;
                            item.DELVDATE = dateFormat.format(item.DELVDATE);
                        })

                        me._counts.total = oData.results.length;
                        me._counts.unassigned = vUnassigned;
                        me._counts.partial = vPartial;
                        me.getView().getModel("counts").setData(me._counts);

                        oJSONDataModel.setData(oData);
                        me.getView().setModel(oJSONDataModel, "mainData");
                        me.closeLoadingDialog();
                        me.setTableData();
                        // me.setChangeStatus(false);
                    },
                    error: function (err) { 
                        console.log(err)
                        me.closeLoadingDialog();
                    }
                });

            },

            onAssign: function() {
                this._oAssignVendorData = [];
                this.showLoadingDialog('Processing...');

                var me = this;
                var oTable = this.byId("mainTab");
                var oSelectedIndices = oTable.getSelectedIndices();
                var oTmpSelectedIndices = [];
                var aData = oTable.getModel().getData().rows;
                var oParamData = [];
                var oParam = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");

                if (oSelectedIndices.length > 0) {
                    oSelectedIndices.forEach(item => {
                        oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                    })

                    oSelectedIndices = oTmpSelectedIndices;

                    oSelectedIndices.forEach((item, index) => {
                        oParamData.push({
                            Vendor: aData.at(item).VENDOR,
                            Material: aData.at(item).MATERIALNO,
                            PurchOrg: aData.at(item).PURCHORG,
                            PurGroup: aData.at(item).PURCHGRP,
                            Plant: aData.at(item).PURCHPLANT
                        })

                        this._oAssignVendorData.push({
                            PRNUMBER: aData.at(item).PRNUMBER,
                            PRITEMNO: aData.at(item).PRITEMNO,
                            MATERIALNO: aData.at(item).MATERIALNO,
                            IONUMBER: aData.at(item).IONUMBER,
                            QTY: aData.at(item).QTY,
                            UNIT: aData.at(item).UNIT,
                            VENDOR: aData.at(item).VENDOR,
                            PURCHORG: aData.at(item).PURCHORG,
                            PURCHPLANT: aData.at(item).PURCHPLANT,
                            PURCHGRP: aData.at(item).PURCHGRP,
                            REMARKS: ''
                        })
                    })
                    
                    oParamData = oParamData.filter((value, index, self) => self.findIndex(item => item.Vendor === value.Vendor && item.Material === value.Material && item.PurchOrg === value.PurchOrg && item.PurGroup === value.PurGroup) === index) ;

                    oParam['N_GetInfoRecMatParam'] = oParamData;
                    oParam['N_GetInfoRecReturn'] = [];
                    // console.log(oParam)

                    oModel.create("/GetInfoRecordSet", oParam, {
                        method: "POST",
                        success: function(oResult, oResponse) {
                            // console.log(oResult.N_GetInfoRecReturn)
                            var oManualAssignVendorData = [];
                            oParamData = [];
                            oParam = {};

                            oSelectedIndices.forEach(selItemIdx => {
                                var returnData = jQuery.extend(true, [], oResult.N_GetInfoRecReturn.results);

                                if (aData.at(selItemIdx).VENDOR !== '') returnData = returnData.filter(fItem => fItem.Vendor === aData.at(selItemIdx).VENDOR);
                                if (aData.at(selItemIdx).MATERIALNO !== '') returnData = returnData.filter(fItem => fItem.Material === aData.at(selItemIdx).MATERIALNO);
                                if (aData.at(selItemIdx).PURCHPLANT !== '') returnData = returnData.filter(fItem => fItem.Plant === aData.at(selItemIdx).PURCHPLANT);
                                if (aData.at(selItemIdx).PURCHGRP !== '') returnData = returnData.filter(fItem => fItem.PurGroup === aData.at(selItemIdx).PURCHGRP);
                                if (aData.at(selItemIdx).PURCHORG !== '') returnData = returnData.filter(fItem => fItem.PurchOrg === aData.at(selItemIdx).PURCHORG);

                                if (returnData.length > 0) {
                                    if (returnData[0].RetType === 'E') {
                                        me._oAssignVendorData.filter(fItem => fItem.PRNUMBER === aData.at(selItemIdx).PRNUMBER && fItem.PRITEMNO === aData.at(selItemIdx).PRITEMNO)
                                            .forEach(item => item.REMARKS = returnData[0].RetMessage);
                                    }
                                    else if (returnData.length === 1) {
                                        // call function module ZFM_ERP_CHANGE_PR
                                        oParamData.push({
                                            PreqNo: aData.at(selItemIdx).PRNUMBER,
                                            PreqItem: aData.at(selItemIdx).PRITEMNO,
                                            Matno: aData.at(selItemIdx).MATERIALNO,
                                            Uom: aData.at(selItemIdx).UNIT,
                                            Quantity: aData.at(selItemIdx).QTY,
                                            DelivDate: sapDateFormat.format(new Date(aData.at(selItemIdx).DELVDATE)),
                                            Batch: aData.at(selItemIdx).IONUMBER,
                                            Plant: returnData[0].Plant,
                                            Purgrp: returnData[0].PurGroup,
                                            Reqsnr: aData.at(selItemIdx).REQUISITIONER,
                                            DesVendor: returnData[0].Vendor,
                                            PurchOrg: returnData[0].PurchOrg,
                                            Trackingno: aData.at(selItemIdx).TRACKINGNO,
                                            Supplytyp: aData.at(selItemIdx).SUPPLYTYPE,
                                            InfoRec: returnData[0].InfoRec,
                                            Shiptoplant: aData.at(selItemIdx).SHIPTOPLANT,
                                            Seasoncd: aData.at(selItemIdx).SEASON,
                                            ShortText: aData.at(selItemIdx).SHORTTEXT,
                                            Callbapi: 'X'
                                        })                                        
                                    }
                                    else if (returnData.length > 1) {
                                        returnData.forEach(item => {
                                            item.PRNUMBER = aData.at(selItemIdx).PRNUMBER;
                                            item.PRITEMNO = aData.at(selItemIdx).PRITEMNO;
                                            item.MATERIALNO = aData.at(selItemIdx).MATERIALNO;
                                            item.UNIT = aData.at(selItemIdx).UNIT;
                                            item.QTY = aData.at(selItemIdx).QTY;
                                            item.DELVDATE = aData.at(selItemIdx).DELVDATE;
                                            item.IONUMBER = aData.at(selItemIdx).IONUMBER;
                                            item.REQUISITIONER = aData.at(selItemIdx).REQUISITIONER;
                                            item.TRACKINGNO = aData.at(selItemIdx).TRACKINGNO;
                                            item.SUPPLYTYPE = aData.at(selItemIdx).SUPPLYTYPE;
                                            item.SHIPTOPLANT = aData.at(selItemIdx).SHIPTOPLANT;
                                            item.SEASON = aData.at(selItemIdx).SEASON;
                                            item.SHORTTEXT = aData.at(selItemIdx).SHORTTEXT;

                                            oManualAssignVendorData.push(item);
                                        });
                                    }
                                }
                                else {
                                    me._oAssignVendorData.filter(fItem => fItem.PRNUMBER === aData.at(selItemIdx).PRNUMBER && fItem.PRITEMNO === aData.at(selItemIdx).PRITEMNO)
                                        .forEach(item => item.REMARKS = 'No matching info record found.');
                                }
                            })
                            // console.log(me._oAssignVendorData)
                            // Call change PR function module
                            if (oParamData.length > 0) {
                                oParam['N_ChangePRParam'] = oParamData;
                                oParam['N_ChangePRReturn'] = [];
                                console.log(oParam)
                                oModel.create("/ChangePRSet", oParam, {
                                    method: "POST",
                                    success: function(oResultCPR, oResponse) {
                                        console.log(oResultCPR);

                                        if (oResultCPR.N_ChangePRReturn.results.length > 0) {
                                            me._oAssignVendorData.forEach(item => {
                                                var oRetMsg = oResultCPR.N_ChangePRReturn.results.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO);

                                                if (oRetMsg.length > 0) {
                                                    if (oRetMsg[0].Type === 'S') {
                                                        var pVendor = oParamData.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO)[0].DesVendor;
                                                        var pPurchOrg = oParamData.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO)[0].PurchOrg;
                                                        
                                                        if (item.VENDOR !== '' && item.VENDOR !== pVendor) {
                                                            item.REMARKS = 'Vendor updated.';
                                                        }
                                                        else if (item.VENDOR === '' && item.VENDOR !== pVendor) {
                                                            item.REMARKS = 'Vendor assigned.';
                                                        }
                                                        else if (item.PURCHORG !== '' && item.PURCHORG !== pPurchOrg) {
                                                            item.REMARKS = 'Purchasing Org updated.';
                                                        }
                                                        else {
                                                            item.REMARKS = Message;
                                                        }
                                                    }
                                                    else {
                                                        item.REMARKS = Message;
                                                    }
                                                }
                                                else {
                                                    item.REMARKS = 'No return message on PR change.';
                                                }
                                            })
                                        }

                                        // MessageBox.information(res.RetMsgSet.results[0].Message);
                                        if (oManualAssignVendorData.length > 0) {
                                            me.closeLoadingDialog();
                                            // display pop-up for user selection
                                            if (!me._AssignVendorDialog) {
                                                me._AssignVendorDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.AssignVendorDialog", me);

                                                me._AssignVendorDialog.setModel(
                                                    new JSONModel({
                                                        items: oManualAssignVendorData,
                                                        rowCount: oManualAssignVendorData.length
                                                    })
                                                )

                                                me.getView().addDependent(me._AssignVendorDialog);
                                            }
                                            else {
                                                me._AssignVendorDialog.getModel().setProperty("/items", oManualAssignVendorData);
                                                me._AssignVendorDialog.getModel().setProperty("/rowCount", oManualAssignVendorData.length);
                                            }

                                            me._AssignVendorDialog.open();
                                        }
                                        else {
                                            me.closeLoadingDialog();
                                            me.showAssignVendorResult();
                                        }
                                    },
                                    error: function() {
                                        // alert("Error");
                                    }
                                });
                            }
                            else if (oManualAssignVendorData.length > 0) {
                                me.closeLoadingDialog();
                                // display pop-up for user selection
                                if (!me._AssignVendorDialog) {
                                    me._AssignVendorDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.AssignVendorDialog", me);

                                    me._AssignVendorDialog.setModel(
                                        new JSONModel({
                                            items: oManualAssignVendorData,
                                            rowCount: oManualAssignVendorData.length
                                        })
                                    )

                                    me.getView().addDependent(me._AssignVendorDialog);
                                }
                                else {
                                    me._AssignVendorDialog.getModel().setProperty("/items", oManualAssignVendorData);
                                    me._AssignVendorDialog.getModel().setProperty("/rowCount", oManualAssignVendorData.length);
                                }

                                me._AssignVendorDialog.open();
                            }
                            else {
                                me.closeLoadingDialog();
                                me.showAssignVendorResult();
                            }
                        },
                        error: function() {
                            // alert("Error");
                        }
                    });
                }
                else {
                    // aDataToEdit = aData;
                    sap.m.MessageBox.information("No selected record(s) to process.");
                }
            },

            onAssignVendorManualSave: function(oEvent) {
                // console.log(this._AssignVendorDialog)
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                var oSource = oEvent.getSource();
                console.log(oSource.oParent)
                var oTable = oSource.oParent.getContent()[0];
                console.log(oTable)
                var oSelectedIndices = oTable.getSelectedIndices();
                var aData = oTable.getModel().getData().items;
                var oParamData = [];
                var oParam = {};
                console.log(oTable.getSelectedIndices())

                if (oSelectedIndices.length > 0) {
                    oSelectedIndices.forEach((selItemIdx, index) => {
                        oParamData.push({
                            PR: aData.at(selItemIdx).PRNUMBER + aData.at(selItemIdx).PRITEMNO
                        })
                    })

                    // console.log(oParamData)
                    // console.log(oParamData.filter((value, index, self) => self.findIndex(item => item.PR === value.PR) === index))
                    if (oParamData.length !== oParamData.filter((value, index, self) => self.findIndex(item => item.PR === value.PR) === index).length) {
                        sap.m.MessageBox.information("Please select only 1 record per PR Number / PR Item No.");
                    }
                    else {
                        oParamData = [];
                        oParam = {};

                        oSelectedIndices.forEach((selItemIdx, index) => {
                            oParamData.push({
                                PreqNo: aData.at(selItemIdx).PRNUMBER,
                                PreqItem: aData.at(selItemIdx).PRITEMNO,
                                Matno: aData.at(selItemIdx).MATERIALNO,
                                Uom: aData.at(selItemIdx).UNIT,
                                Quantity: aData.at(selItemIdx).QTY,
                                DelivDate: sapDateFormat.format(new Date(aData.at(selItemIdx).DELVDATE)),
                                Batch: aData.at(selItemIdx).IONUMBER,
                                Plant: aData.at(selItemIdx).Plant,
                                Purgrp: aData.at(selItemIdx).PurGroup,
                                Reqsnr: aData.at(selItemIdx).REQUISITIONER,
                                DesVendor: aData.at(selItemIdx).Vendor,
                                PurchOrg: aData.at(selItemIdx).PurchOrg,
                                Trackingno: aData.at(selItemIdx).TRACKINGNO,
                                Supplytyp: aData.at(selItemIdx).SUPPLYTYPE,
                                InfoRec: aData.at(selItemIdx).InfoRec,
                                Shiptoplant: aData.at(selItemIdx).SHIPTOPLANT,
                                Seasoncd: aData.at(selItemIdx).SEASON,
                                ShortText: aData.at(selItemIdx).SHORTTEXT,
                                Callbapi: 'X'
                            })
                        })

                        oParam['N_ChangePRParam'] = oParamData;
                        oParam['N_ChangePRReturn'] = [];
                        console.log(oParam)
                        oModel.create("/ChangePRSet", oParam, {
                            method: "POST",
                            success: function(oResultCPR, oResponse) {
                                console.log(oResultCPR);

                                if (oResultCPR.N_ChangePRReturn.results.length > 0) {
                                    this._oAssignVendorData.forEach(item => {
                                        var oRetMsg = oResultCPR.N_ChangePRReturn.results.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO);

                                        if (oRetMsg.length > 0) {
                                            if (oRetMsg[0].Type === 'S') {
                                                var pVendor = oParamData.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO)[0].DesVendor;
                                                var pPurchOrg = oParamData.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO)[0].PurchOrg;
                                                
                                                if (item.VENDOR !== '' && item.VENDOR !== pVendor) {
                                                    item.REMARKS = 'Vendor updated.';
                                                }
                                                else if (item.VENDOR === '' && item.VENDOR !== pVendor) {
                                                    item.REMARKS = 'Vendor assigned.';
                                                }
                                                else if (item.PURCHORG !== '' && item.PURCHORG !== pPurchOrg) {
                                                    item.REMARKS = 'Purchasing Org updated.';
                                                }
                                                else {
                                                    item.REMARKS = Message;
                                                }
                                            }
                                            else {
                                                item.REMARKS = Message;
                                            }
                                        }
                                        else {
                                            item.REMARKS = 'No return message on PR change.';
                                        }
                                    })
                                }

                                this.showAssignVendorResult();
                                // MessageBox.information(res.RetMsgSet.results[0].Message);
                            },
                            error: function() {
                                // alert("Error");
                            }
                        });                        
                    }
                }
                else {
                    sap.m.MessageBox.information("No selected record(s) to process.");
                }

                // this._AssignVendorDialog.close();
            },

            onAssignVendorManualCancel: function(oEvent) {
                this._AssignVendorDialog.close();
            },

            onAssignVendorClose: function(oEvent) {
                this.refreshTableData();
                this._AssignVendorResultDialog.close();
            },

            showAssignVendorResult() {
                console.log(this._oAssignVendorData)
                // display pop-up for user selection
                if (!this._AssignVendorResultDialog) {
                    this._AssignVendorResultDialog = sap.ui.xmlfragment("zuiaprocess.view.fragments.dialog.AssignVendorResultDialog", this);

                    this._AssignVendorResultDialog.setModel(
                        new JSONModel({
                            items: this._oAssignVendorData,
                            rowCount: this._oAssignVendorData.length
                        })
                    )

                    this.getView().addDependent(this._AssignVendorResultDialog);
                }
                else {
                    this._AssignVendorResultDialog.getModel().setProperty("/items", this._oAssignVendorData);
                    this._AssignVendorResultDialog.getModel().setProperty("/rowCount", this._oAssignVendorData.length);
                }

                this._AssignVendorResultDialog.setTitle("Unassign Vendor Result")
                this._AssignVendorResultDialog.open();
            },

            onUnassign: function() {
                this._oAssignVendorData = [];
                this.showLoadingDialog('Processing...');

                var me = this;
                var oTable = this.byId("mainTab");
                var oSelectedIndices = oTable.getSelectedIndices();
                var oTmpSelectedIndices = [];
                var aData = oTable.getModel().getData().rows;
                var oParamData = [];
                var oParam = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");

                if (oSelectedIndices.length > 0) {
                    oSelectedIndices.forEach(item => {
                        oTmpSelectedIndices.push(oTable.getBinding("rows").aIndices[item])
                    })

                    oSelectedIndices = oTmpSelectedIndices;

                    oSelectedIndices.forEach((selItemIdx, index) => {
                        oParamData.push({
                            PreqNo: aData.at(selItemIdx).PRNUMBER,
                            PreqItem: aData.at(selItemIdx).PRITEMNO,
                            Matno: aData.at(selItemIdx).MATERIALNO,
                            Uom: aData.at(selItemIdx).UNIT,
                            Quantity: aData.at(selItemIdx).QTY,
                            DelivDate: sapDateFormat.format(new Date(aData.at(selItemIdx).DELVDATE)),
                            Batch: aData.at(selItemIdx).IONUMBER,
                            Plant: aData.at(selItemIdx).PURCHPLANT,
                            Purgrp: aData.at(selItemIdx).PURCHGRP,
                            Reqsnr: aData.at(selItemIdx).REQUISITIONER,
                            DesVendor: '',
                            PurchOrg: '',
                            Trackingno: aData.at(selItemIdx).TRACKINGNO,
                            Supplytyp: aData.at(selItemIdx).SUPPLYTYPE,
                            InfoRec: '',
                            Shiptoplant: aData.at(selItemIdx).SHIPTOPLANT,
                            Seasoncd: aData.at(selItemIdx).SEASON,
                            ShortText: aData.at(selItemIdx).SHORTTEXT,
                            Callbapi: 'X'
                        })

                        this._oAssignVendorData.push({
                            PRNUMBER: aData.at(selItemIdx).PRNUMBER,
                            PRITEMNO: aData.at(selItemIdx).PRITEMNO,
                            MATERIALNO: aData.at(selItemIdx).MATERIALNO,
                            IONUMBER: aData.at(selItemIdx).IONUMBER,
                            QTY: aData.at(selItemIdx).QTY,
                            UNIT: aData.at(selItemIdx).UNIT,
                            VENDOR: aData.at(selItemIdx).VENDOR,
                            PURCHORG: aData.at(selItemIdx).PURCHORG,
                            PURCHPLANT: aData.at(selItemIdx).PURCHPLANT,
                            PURCHGRP: aData.at(selItemIdx).PURCHGRP,
                            REMARKS: ''
                        })
                    })

                    oParam['N_ChangePRParam'] = oParamData;
                    oParam['N_ChangePRReturn'] = [];
                    console.log(oParam)
                    oModel.create("/ChangePRSet", oParam, {
                        method: "POST",
                        success: function(oResultCPR, oResponse) {
                            console.log(oResultCPR);
                            me.closeLoadingDialog();

                            if (oResultCPR.N_ChangePRReturn.results.length > 0) {
                                me._oAssignVendorData.forEach(item => {
                                    var oRetMsg = oResultCPR.N_ChangePRReturn.results.filter(fItem => fItem.PreqNo === item.PRNUMBER && fItem.PreqItem === item.PRITEMNO);

                                    if (oRetMsg.length > 0) {
                                        item.REMARKS = Message;
                                    }
                                    else {
                                        item.REMARKS = 'No return message on PR change.';
                                    }
                                })
                            }

                            me.showAssignVendorResult();
                            // MessageBox.information(res.RetMsgSet.results[0].Message);
                        },
                        error: function() {
                            // alert("Error");
                        }
                    }); 
                }
                else {
                    // aDataToEdit = aData;
                    sap.m.MessageBox.information("No selected record(s) to process.");
                }
            },

            refreshTableData: function () {
                this.showLoadingDialog('Loading...');
                this.byId("searchFieldMain").setProperty("value", "");

                var me = this;
                var oModel = this.getOwnerComponent().getModel();
                var aFilters = this.getView().byId("smartFilterBar").getFilters();

                if (aFilters.length > 0) {
                    aFilters[0].aFilters.forEach(item => {
                        // console.log(item)
                        if (item.sPath === 'VENDOR') {
                            if (!isNaN(item.oValue1)) {
                                while (item.oValue1.length < 10) item.oValue1 = "0" + item.oValue1;
                            }
                        }
                    })
                }

                //get styles data for the table
                var oJSONDataModel = new JSONModel(); 

                oModel.read("/MainSet", {
                    filters: aFilters,
                    success: function (oData, oResponse) {
                        var vUnassigned = 0, vPartial = 0;
                        // console.log(oData)
                        oData.results.forEach(item => {
                            if (item.VENDOR === '') vUnassigned++;
                            if (item.QTY !== item.ORDERQTY) vPartial++;
                            item.DELVDATE = dateFormat.format(item.DELVDATE);
                        })

                        me._counts.total = oData.results.length;
                        me._counts.unassigned = vUnassigned;
                        me._counts.partial = vPartial;
                        me.getView().getModel("counts").setData(me._counts);

                        oJSONDataModel.setData(oData);
                        me.getView().setModel(oJSONDataModel, "mainData");
                        me.closeLoadingDialog();
                        me.setTableData();
                        // me.setChangeStatus(false);
                    },
                    error: function (err) { 
                        console.log(err)
                    }
                });

            },

        });
    });
