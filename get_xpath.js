/*
 * Copyright (C) 2011 Google Inc.  All rights reserved.
 * Copyright (C) 2007, 2008 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

Utils = {}

/**
 * @param {!WebInspector.DOMNode} node
 * @param {boolean=} optimized
 * @return {string}
 */
Utils.xPath = function(node, optimized)
{
  if (node.nodeType === Node.DOCUMENT_NODE)
    return "/";
  var steps = [];
  var contextNode = node;

  while (contextNode) {
    var step = Utils._xPathValue(contextNode, optimized);
    if (!step)
      break; // Error - bail out early.
    steps.push(step);
    if (step.optimized)
      break;
    contextNode = contextNode.parentNode;
  }
  steps.reverse();
  return (steps.length && steps[0].optimized ? "" : "/") + steps.join("/");
}
/**
 * @param {!WebInspector.DOMNode} node
 * @param {boolean=} optimized
 * @return {?WebInspector.DOMNodePathStep}
 */
Utils._xPathValue = function(node, optimized)
{
  var ownValue;
  var ownIndex = Utils._xPathIndex(node);
  if (ownIndex === -1)
    return null; // Error.
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      if (optimized && node.getAttribute("id"))
        return new DOMNodePathStep("//*[@id=\"" + node.getAttribute("id") + "\"]", true);
      ownValue = node.localName;
      break;
    case Node.ATTRIBUTE_NODE:
      ownValue = "@" + node.nodeName;
      break;
    case Node.TEXT_NODE:
    case Node.CDATA_SECTION_NODE:
      ownValue = "text()";
      break;
    case Node.PROCESSING_INSTRUCTION_NODE:
      ownValue = "processing-instruction()";
      break;
    case Node.COMMENT_NODE:
      ownValue = "comment()";
      break;
    case Node.DOCUMENT_NODE:
      ownValue = "";
      break;
    default:
      ownValue = "";
      break;
  }
  if (ownIndex > 0)
    ownValue += "[" + ownIndex + "]";
  return new DOMNodePathStep(ownValue, node.nodeType === Node.DOCUMENT_NODE);
}
/**
 * @param {!WebInspector.DOMNode} node
 * @return {number}
 */
Utils._xPathIndex = function(node)
{
  // Returns -1 in case of error, 0 if no siblings matching the same expression, <XPath index among the same expression-matching sibling nodes> otherwise.
  function areNodesSimilar(left, right)
  {
    if (left === right)
      return true;
    if (left.nodeType === Node.ELEMENT_NODE && right.nodeType === Node.ELEMENT_NODE)
      return left.localName === right.localName;
    if (left.nodeType === right.nodeType)
      return true;
    // XPath treats CDATA as text nodes.
    var leftType = left.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : left.nodeType;
    var rightType = right.nodeType === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : right.nodeType;
    return leftType === rightType;
  }
  var siblings = node.parentNode ? node.parentNode.children : null;
  if (!siblings)
    return 0; // Root node - no siblings.
  var hasSameNamedElements;
  for (var i = 0; i < siblings.length; ++i) {
    if (areNodesSimilar(node, siblings[i]) && siblings[i] !== node) {
      hasSameNamedElements = true;
      break;
    }
  }
  if (!hasSameNamedElements)
    return 0;
  var ownIndex = 1; // XPath indices start with 1.
  for (var i = 0; i < siblings.length; ++i) {
    if (areNodesSimilar(node, siblings[i])) {
      if (siblings[i] === node)
        return ownIndex;
      ++ownIndex;
    }
  }
  return -1; // An error occurred: |node| not found in parent's children.
}

var DOMNodePathStep = function(value, optimized)
{
  this.value = value;
  this.optimized = optimized || false;
}

DOMNodePathStep.prototype = {
  /**
   * @override
   * @return {string}
   */
  toString: function()
  {
    return this.value;
  }
}

module.exports = Utils.xPath
