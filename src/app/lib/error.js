// unused, but could be used in the future


function errorCheck(result) {
  if (result.error) {
    throw new Error(result.error.message);
  }
}

function emptyCheck(result) {
  if (result.data.length === 0) {
    throw new Error('No data found');
  }
}

export { errorCheck, emptyCheck }