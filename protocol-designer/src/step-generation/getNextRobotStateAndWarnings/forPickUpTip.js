// @flow
import assert from 'assert'
import cloneDeep from 'lodash/cloneDeep'
import { getIsTiprack } from '@opentrons/shared-data'
import type { PipetteAccessParams } from '@opentrons/shared-data/protocol/flowTypes/schemaV3'
import type {
  InvariantContext,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

export function forPickUpTip(
  params: PipetteAccessParams,
  invariantContext: InvariantContext,
  prevRobotState: RobotState
): RobotStateAndWarnings {
  const { pipette, labware, well } = params

  const pipetteSpec = invariantContext.pipetteEntities[pipette].spec
  const tiprackDef = invariantContext.labwareEntities[labware].def
  assert(
    getIsTiprack(tiprackDef),
    `forPickUpTip expected ${labware} to be a tiprack`
  )

  const robotState = cloneDeep(prevRobotState)

  // pipette now has tip(s)
  robotState.tipState.pipettes[pipette] = true

  // remove tips from tiprack
  if (pipetteSpec.channels === 1) {
    robotState.tipState.tipracks[labware][well] = false
  } else if (pipetteSpec.channels === 8) {
    const allWells = tiprackDef.ordering.find(col => col[0] === well)
    if (!allWells) {
      // TODO Ian 2018-04-30 return {errors}, don't throw
      throw new Error('Invalid primary well for tip pickup: ' + well) // TODO IMMEDIATELY: test
    }
    allWells.forEach(function(well) {
      robotState.tipState.tipracks[labware][well] = false
    })
  }

  return {
    warnings: [],
    robotState,
  }
}