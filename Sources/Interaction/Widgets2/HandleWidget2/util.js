import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

// Given display coordinates and a plane, returns the
// point on the plane that corresponds to display coordinates.
export function displayToPlane(
  displayCoords,
  planePoint,
  planeNormal,
  interactor
) {
  const view = interactor.getView();
  const renderer = interactor.getCurrentRenderer();
  const camera = renderer.getActiveCamera();

  const cameraFocalPoint = camera.getFocalPoint();
  const cameraPos = camera.getPosition();

  // Adapted from vtkPicker
  const focalPointDispCoords = view.worldToDisplay(
    ...cameraFocalPoint,
    renderer
  );
  const worldCoords = view.displayToWorld(
    displayCoords[0],
    displayCoords[1],
    focalPointDispCoords[2], // Use focal point for z coord
    renderer
  );

  // compute ray from camera to selection
  const ray = [0, 0, 0];
  for (let i = 0; i < 3; ++i) {
    ray[i] = worldCoords[i] - cameraPos[i];
  }

  const dop = camera.getDirectionOfProjection();
  vtkMath.normalize(dop);
  // gets distance from camera to a plane defined by the worldCoords
  // vector and the dop normal vector
  const rayLength = vtkMath.dot(dop, ray);

  const clipRange = camera.getClippingRange();

  const p1World = [0, 0, 0];
  const p2World = [0, 0, 0];

  // get line segment coords from ray based on clip range
  if (camera.getParallelProjection()) {
    const tF = clipRange[0] - rayLength;
    const tB = clipRange[1] - rayLength;
    for (let i = 0; i < 3; i++) {
      p1World[i] = planePoint[i] + tF * dop[i];
      p2World[i] = planePoint[i] + tB * dop[i];
    }
  } else {
    const tF = clipRange[0] / rayLength;
    const tB = clipRange[1] / rayLength;
    for (let i = 0; i < 3; i++) {
      p1World[i] = cameraPos[i] + tF * ray[i];
      p2World[i] = cameraPos[i] + tB * ray[i];
    }
  }

  const r = vtkPlane.intersectWithLine(
    p1World,
    p2World,
    planePoint,
    planeNormal
  );
  return r.intersection ? r.x : null;
}

export default {
  displayToPlane,
};
