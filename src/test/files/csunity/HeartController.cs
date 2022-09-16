using System;
using UnityEngine;

public class HeartController : Pickupable
{
    [SerializeField]
    private float _healAmount = 1;

    protected override void OnPickUp(GameObject actor)
    {
        if (actor.TryGetComponent<HealthSystem>(out HealthSystem healthSystem))
        {
            healthSystem.TakeHeal(_healAmount);
        }
        else
        {
            throw new Exception($"Unexpectedly picked up by actor without {nameof(HealthSystem)} component: {actor.name} ({actor.GetInstanceID()})");
        }
    }
}
