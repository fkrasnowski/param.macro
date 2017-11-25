"use strict";

exports.__esModule = true;
exports.findTargetCallee = findTargetCallee;
exports.findTargetCaller = findTargetCaller;
exports.findWrapper = findWrapper;
exports.hoistArguments = hoistArguments;
exports.shouldHoist = shouldHoist;
exports.wasMacro = wasMacro;
const nonHoistTypes = ['Identifier', 'ArrayExpression', 'ObjectExpression', 'FunctionExpression', 'ArrowFunctionExpression'];

function findTargetCallee(path) {
  if (path.listKey === 'arguments') {
    return path;
  }

  return path.findParent(_it => {
    return _it.listKey === 'arguments';
  });
}

function findTargetCaller(path) {
  var _findTargetCallee;

  return (_findTargetCallee = findTargetCallee(path)) === null || _findTargetCallee === void 0 ? void 0 : _findTargetCallee.parentPath;
}

function findWrapper(path) {
  const callee = findTargetCallee(path);
  let calls = 0;
  let link = callee;

  while (link = (_link = link) === null || _link === void 0 ? void 0 : _link.parentPath) {
    var _link;

    if (link.isCallExpression()) calls++;
    if (calls > 1) break;

    if (link.isArrowFunctionExpression() && wasMacro(link)) {
      return link;
    }
  }

  return null;
}

function hoistArguments(t, caller) {
  const args = caller.get('body.body.0.argument.arguments');
  args.forEach(arg => {
    if (!shouldHoist(arg)) return;
    const id = arg.scope.generateUidIdentifier('ref');
    caller.scope.parent.push({
      id,
      init: arg.node
    });
    arg.replaceWith(id);
  });
}

function shouldHoist(path) {
  const isTransformed = () => {
    var _ref, _path;

    return _ref = (_path = path, findTargetCallee(_path)), wasMacro(_ref);
  };

  const hasMacroArgs = () => path.isCallExpression() && path.get('arguments').some((_arg) => {
    return wasMacro(_arg);
  });

  return !path.isLiteral() && nonHoistTypes.every(_it2 => {
    return _it2 !== path.node.type;
  }) && !isTransformed() && !hasMacroArgs();
}

function wasMacro(path) {
  return path.getData('_.wasPlaceholder', false) || path.getData('it.wasTransformed', false);
}