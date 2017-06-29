var getXPathForElement = require("../get_xpath");

exports.init = function (bs, eventManager) {
  bs.utils.getElementData = function (elem) {
    return {
      tagName: getXPathForElement(elem, true),
      index: 0
    };
  };

  bs.utils.getSingleElement = function (tagName, index) {
    var doc = bs.utils.getDocument();
    return doc.evaluate(tagName, doc, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  };
};
