# Troubleshooting

Common issues and solutions for DClaw Cost.

## Quick Diagnostics

```bash
# Check app pods
kubectl get pods -n dclaw-cost

# Check logs
kubectl logs -n dclaw-cost deployment/dclaw-cost-backend

# Check database
kubectl get clusters -n dclaw-cost
```

## Sections

- [Common Issues](./common-issues)
- [FAQ](./faq)
